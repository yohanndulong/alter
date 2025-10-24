import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from './entities/message.entity';
import { Match } from '../matching/entities/match.entity';
import { User } from '../users/entities/user.entity';
import { LlmService } from '../llm/llm.service';
import { ParametersService } from '../parameters/parameters.service';
import { MediaService } from './media.service';
import { NotificationsService } from '../notifications/notifications.service';
import { replacePlaceholders } from '../parameters/prompt-helper';
import { CONVERSATION_QUALITY_PROMPT } from '../llm/prompts/conversation-quality.prompt';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly llmService: LlmService,
    private readonly parametersService: ParametersService,
    private readonly mediaService: MediaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getMessages(matchId: string): Promise<Message[]> {
    const messages = await this.messageRepository.find({
      where: { matchId },
      order: { createdAt: 'ASC' },
      relations: ['media'],
    });

    // Ajouter les URLs signées pour les médias
    return messages.map(message => {
      if (message.media) {
        message.media.url = this.mediaService.generateSignedUrl(message.media.filePath);
      }
      return message;
    });
  }

  async sendMessage(
    matchId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    const message = this.messageRepository.create({
      matchId,
      senderId,
      receiverId,
      content,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update match last message
    await this.matchRepository.update(
      { id: matchId },
      {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    );

    // Increment unread count for receiver
    const receiverMatch = await this.matchRepository.findOne({
      where: { userId: receiverId, matchedUserId: senderId },
    });
    if (receiverMatch) {
      await this.matchRepository.update(
        { id: receiverMatch.id },
        { unreadCount: () => 'unreadCount + 1' },
      );
    }

    // Envoyer une notification push au destinataire
    try {
      const sender = await this.userRepository.findOne({ where: { id: senderId } });
      if (sender) {
        // Tronquer le message s'il est trop long (max 100 caractères)
        const messagePreview = content.length > 100
          ? content.substring(0, 97) + '...'
          : content;

        await this.notificationsService.sendNewMessageNotification(
          receiverId,
          sender.name,
          messagePreview,
          matchId,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'envoi de la notification push: ${error.message}`);
      // Ne pas échouer la création du message si la notification échoue
    }

    return savedMessage;
  }

  async markAsRead(matchId: string, userId: string): Promise<void> {
    await this.messageRepository.update(
      { matchId, receiverId: userId, read: false },
      { read: true },
    );

    const match = await this.matchRepository.findOne({
      where: { id: matchId, userId },
    });
    if (match) {
      await this.matchRepository.update({ id: matchId }, { unreadCount: 0 });
    }
  }

  /**
   * Rejette un média
   */
  async rejectMedia(mediaId: string, receiverId: string) {
    // Rejeter le média
    const media = await this.mediaService.rejectMedia(mediaId, receiverId);
    this.logger.log(`❌ Media ${mediaId} rejected by ${receiverId}`);
    return media;
  }

  /**
   * Analyse la qualité d'une conversation avec le LLM
   */
  async analyzeConversationQuality(matchId: string): Promise<{
    overallScore: number;
    respect: number;
    engagement: number;
    depth: number;
    positivity: number;
    analysis: string;
  }> {
    this.logger.log(`🔍 Analyzing conversation quality for match ${matchId}`);

    // Récupérer tous les messages de la conversation
    const messages = await this.messageRepository.find({
      where: { matchId },
      order: { createdAt: 'ASC' },
      relations: ['sender'],
    });

    if (messages.length === 0) {
      this.logger.warn('No messages to analyze');
      return {
        overallScore: 0,
        respect: 0,
        engagement: 0,
        depth: 0,
        positivity: 0,
        analysis: 'Pas encore de messages à analyser. Commencez la conversation !',
      };
    }

    // Formater l'historique de conversation
    const conversationHistory = messages
      .map((msg, index) => {
        const senderName = msg.sender?.name || 'User';
        let content: string;

        if (msg.type === MessageType.TEXT) {
          content = msg.content;
        } else if (msg.type === MessageType.VOICE) {
          content = '[Message vocal]';
        } else if (msg.type === MessageType.PHOTO) {
          // Vérifier si la photo a été rejetée
          if (msg.media && msg.media.receiverStatus === 'rejected') {
            content = '[Photo refusée par le destinataire - contenu sensible]';
          } else {
            content = '[Photo]';
          }
        } else if (msg.type === MessageType.SYSTEM) {
          content = `[MESSAGE SYSTÈME: ${msg.content}]`;
        } else {
          content = msg.content || '';
        }

        return `[${index + 1}] ${senderName}: ${content}`;
      })
      .join('\n');

    try {
      // Récupérer le prompt depuis les paramètres ou utiliser le prompt par défaut
      let promptTemplate: string;
      try {
        promptTemplate = await this.parametersService.get<string>('prompts.conversation_quality');
      } catch (error) {
        this.logger.warn('Using default conversation quality prompt');
        promptTemplate = CONVERSATION_QUALITY_PROMPT;
      }

      // Remplacer les placeholders
      const systemPrompt = replacePlaceholders(promptTemplate, {
        conversation_history: conversationHistory,
      });

      const llmMessages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
      ];

      const response = await this.llmService.chat(llmMessages, {
        jsonMode: true,
        temperature: 0.3,
      });

      // Nettoyer la réponse (retirer les backticks markdown si présents)
      let cleanedContent = response.content.trim();

      // Retirer les triple backticks markdown (```json ... ``` ou ``` ... ```)
      if (cleanedContent.startsWith('```')) {
        // Retirer la première ligne (```json ou ```)
        cleanedContent = cleanedContent.substring(cleanedContent.indexOf('\n') + 1);
        // Retirer la dernière ligne (```)
        cleanedContent = cleanedContent.substring(0, cleanedContent.lastIndexOf('```')).trim();
      }

      const parsedResult = JSON.parse(cleanedContent);

      // Support de l'ancien format {score, feedback} et du nouveau {overallScore, respect, ...}
      let result;
      if (parsedResult.score !== undefined && parsedResult.feedback !== undefined) {
        // Ancien format - mapper vers le nouveau
        this.logger.warn('LLM returned old format {score, feedback}, mapping to new format');
        result = {
          overallScore: parsedResult.score,
          respect: parsedResult.score, // Approximation
          engagement: parsedResult.score,
          depth: parsedResult.score,
          positivity: parsedResult.score,
          analysis: parsedResult.feedback,
        };
      } else {
        // Nouveau format
        result = parsedResult;
      }

      this.logger.log(`✅ Conversation analyzed: ${result.overallScore}% overall quality`);

      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to analyze conversation: ${error.message}`);

      // Retourner des scores par défaut en cas d'erreur
      return {
        overallScore: 75,
        respect: 80,
        engagement: 75,
        depth: 70,
        positivity: 75,
        analysis: 'L\'analyse de la conversation est temporairement indisponible. Vos échanges semblent se dérouler correctement.',
      };
    }
  }
}
