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

  /**
   * Cursor-based sync: returns only messages with sequenceId > after
   * Enables efficient incremental synchronization
   */
  async syncMessages(matchId: string, afterSequenceId: number): Promise<Message[]> {
    this.logger.log(`🔄 Syncing messages for match ${matchId} after sequence ${afterSequenceId}`);

    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.matchId = :matchId', { matchId })
      .andWhere('message.sequenceId > :afterSequenceId', { afterSequenceId })
      .leftJoinAndSelect('message.media', 'media')
      .orderBy('message.sequenceId', 'ASC')
      .getMany();

    // Ajouter les URLs signées pour les médias
    const messagesWithUrls = messages.map(message => {
      if (message.media) {
        message.media.url = this.mediaService.generateSignedUrl(message.media.filePath);
      }
      return message;
    });

    this.logger.log(`✅ Synced ${messages.length} new messages`);

    return messagesWithUrls;
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
      // Marquer comme livré immédiatement (création = livraison au serveur)
      delivered: true,
      deliveredAt: new Date(),
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

        this.logger.log(`📤 Envoi notification de message: ${sender.name} (${senderId}) → ${receiverId}`);

        await this.notificationsService.sendNewMessageNotification(
          receiverId,
          sender.name,
          messagePreview,
          matchId,
        );

        this.logger.log(`✅ Notification de message envoyée avec succès`);
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
        maxTokens: 2000, // Augmenter pour éviter les réponses tronquées
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

      let parsedResult;
      try {
        parsedResult = JSON.parse(cleanedContent);
      } catch (parseError) {
        this.logger.error('❌ Failed to parse LLM JSON response:', parseError.message);
        this.logger.warn('Raw content length:', cleanedContent.length);
        this.logger.warn('Content preview:', cleanedContent.substring(0, 500));

        // Tentative de réparation : compléter les accolades/guillemets manquants
        let repairedContent = cleanedContent;

        // Compter les accolades/crochets pour détecter un JSON incomplet
        const openBraces = (repairedContent.match(/{/g) || []).length;
        const closeBraces = (repairedContent.match(/}/g) || []).length;

        if (openBraces > closeBraces) {
          this.logger.warn(`Incomplete JSON detected: ${openBraces} open braces vs ${closeBraces} close braces`);
          // Ajouter les accolades manquantes
          repairedContent += '"}'.repeat(openBraces - closeBraces);

          try {
            parsedResult = JSON.parse(repairedContent);
            this.logger.log('✅ Successfully repaired and parsed JSON');
          } catch (repairError) {
            this.logger.error('❌ Failed to repair JSON, using fallback');
            throw parseError; // Relancer l'erreur originale pour le catch principal
          }
        } else {
          throw parseError;
        }
      }

      // Support de différents formats de réponse du LLM
      let result;

      // Format 1 : Ancien format simple {score, feedback}
      if (parsedResult.score !== undefined && parsedResult.feedback !== undefined) {
        this.logger.warn('LLM returned old format {score, feedback}, mapping to new format');
        result = {
          overallScore: parsedResult.score,
          respect: parsedResult.score,
          engagement: parsedResult.score,
          depth: parsedResult.score,
          positivity: parsedResult.score,
          analysis: parsedResult.feedback,
        };
      }
      // Format 2 : Nouveau format détaillé avec objets imbriqués
      else if (parsedResult.global !== undefined) {
        this.logger.log('LLM returned detailed nested format, extracting scores');
        result = {
          overallScore: parsedResult.global?.score || 0,
          respect: parsedResult.respect?.score || 0,
          engagement: parsedResult.engagement?.score || 0,
          depth: parsedResult.profondeur?.score || 0, // "profondeur" en français
          positivity: parsedResult.positivite?.score || 0, // "positivite" en français
          analysis: parsedResult.global?.verdict || parsedResult.global?.commentaire || 'Analyse non disponible',
        };
      }
      // Format 3 : Format flat direct {overallScore, respect, ...}
      else if (parsedResult.overallScore !== undefined) {
        result = parsedResult;
      }
      // Format inconnu
      else {
        this.logger.warn('Unknown LLM response format, using default values');
        this.logger.warn(`Response structure: ${JSON.stringify(Object.keys(parsedResult))}`);
        result = {
          overallScore: 50,
          respect: 50,
          engagement: 50,
          depth: 50,
          positivity: 50,
          analysis: 'Format de réponse inattendu du LLM.',
        };
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

  /**
   * Génère des suggestions de sujets de conversation basées sur les intérêts communs
   */
  async generateConversationSuggestions(matchId: string, userId: string): Promise<any> {
    try {
      // Récupérer le match
      const match = await this.matchRepository.findOne({
        where: { id: matchId },
        relations: ['user', 'matchedUser'],
      });

      if (!match) {
        throw new Error('Match not found');
      }

      // Identifier l'utilisateur actuel et l'utilisateur matché
      const currentUser = match.user.id === userId ? match.user : match.matchedUser;
      const otherUser = match.user.id === userId ? match.matchedUser : match.user;

      // Trouver les intérêts communs
      const currentUserInterests = currentUser.interests || [];
      const otherUserInterests = otherUser.interests || [];
      const commonInterests = currentUserInterests.filter(interest =>
        otherUserInterests.includes(interest)
      );

      // Récupérer les derniers messages pour comprendre le contexte
      const recentMessages = await this.messageRepository.find({
        where: { matchId },
        order: { createdAt: 'DESC' },
        take: 10,
      });

      const hasMessages = recentMessages.length > 0;
      const lastMessageTime = hasMessages ? recentMessages[0].createdAt : null;
      const daysSinceLastMessage = lastMessageTime
        ? Math.floor((Date.now() - new Date(lastMessageTime).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Construire le prompt pour l'IA
      const prompt = `Tu es un expert en communication et relations. Génère 3 suggestions de sujets de conversation pour relancer ou enrichir une discussion.

Contexte:
- Utilisateur 1 (${currentUser.name}): ${currentUser.alterSummary || 'Profil en construction'}
- Utilisateur 2 (${otherUser.name}): ${otherUser.alterSummary || 'Profil en construction'}
- Intérêts communs: ${commonInterests.join(', ') || 'Aucun intérêt commun identifié'}
${hasMessages ? `- Nombre de messages échangés: ${recentMessages.length}` : '- Aucun message échangé'}
${daysSinceLastMessage !== null ? `- Jours depuis le dernier message: ${daysSinceLastMessage}` : ''}

Instructions:
1. Si la conversation est stagnante (peu de messages ou ancien), propose des ice-breakers basés sur les intérêts communs
2. Si la conversation est active, propose d'approfondir des sujets connexes
3. Sois créatif, empathique et adapté aux personnalités
4. Chaque suggestion doit être une question ou une phrase d'accroche prête à envoyer

Format de réponse JSON attendu:
{
  "suggestions": [
    {
      "topic": "Nom du sujet (2-3 mots)",
      "message": "Message prêt à envoyer",
      "icon": "emoji représentant le sujet"
    }
  ]
}`;

      const response = await this.llmService.chat(
        [{ role: 'user', content: prompt }],
        { jsonMode: true, temperature: 0.8, maxTokens: 500 }
      );

      const result = JSON.parse(response.content);
      return result;
    } catch (error) {
      this.logger.error(`Failed to generate conversation suggestions: ${error.message}`);

      // Suggestions par défaut en cas d'erreur
      return {
        suggestions: [
          {
            topic: 'Passions',
            message: 'Qu\'est-ce qui te passionne en ce moment ?',
            icon: '✨',
          },
          {
            topic: 'Voyage',
            message: 'Si tu pouvais partir n\'importe où demain, ce serait où ?',
            icon: '✈️',
          },
          {
            topic: 'Week-end',
            message: 'Tu as fait quoi de sympa ce week-end ?',
            icon: '🌟',
          },
        ],
      };
    }
  }
}
