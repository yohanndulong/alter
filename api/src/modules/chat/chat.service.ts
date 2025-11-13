import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from './entities/message.entity';
import { Match } from '../matching/entities/match.entity';
import { User } from '../users/entities/user.entity';
import { ConversationStartersCache } from './entities/conversation-starters-cache.entity';
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
    @InjectRepository(ConversationStartersCache)
    private readonly conversationStartersCacheRepository: Repository<ConversationStartersCache>,
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
   * Génère des suggestions de sujets de conversation basées sur les profils et la compatibilité
   * Implémente un système de fallback: IA → Points communs → Prédéfini
   */
  async generateConversationSuggestions(matchId: string, userId: string, forceRefresh = false): Promise<any> {
    try {
      this.logger.log(`🎯 Generating conversation starters for match ${matchId} (forceRefresh=${forceRefresh})`);

      // Si forceRefresh, supprimer le cache existant
      if (forceRefresh) {
        await this.conversationStartersCacheRepository.delete({ matchId });
        this.logger.log(`🗑️ Deleted cached conversation starters for match ${matchId}`);
      }

      // Vérifier d'abord si on a déjà un cache (sauf si forceRefresh)
      if (!forceRefresh) {
        const cachedStarters = await this.conversationStartersCacheRepository.findOne({
          where: { matchId },
        });

        if (cachedStarters) {
          this.logger.log(`💾 Using cached conversation starters for match ${matchId}`);
          return {
            suggestions: cachedStarters.suggestions,
            common_ground: cachedStarters.commonGround,
          };
        }
      }

      // Récupérer le match avec les relations nécessaires
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

      // Construire les profils pour le LLM
      const user1Profile = this.buildUserProfileForLLM(currentUser);
      const user2Profile = this.buildUserProfileForLLM(otherUser);

      // Récupérer les scores de compatibilité
      const compatibilityScores = {
        global: match.compatibilityScoreGlobal || 0,
        love: match.compatibilityScoreLove || 0,
        friendship: match.compatibilityScoreFriendship || 0,
        carnal: match.compatibilityScoreCarnal || 0,
      };

      let result: any;

      try {
        // 🚀 Priorité 1: Suggestions IA personnalisées
        this.logger.log('✨ Attempting AI-powered conversation starters...');
        const aiResult = await this.llmService.generateConversationStarters(
          user1Profile,
          user2Profile,
          compatibilityScores,
        );

        this.logger.log(`✅ AI generated ${aiResult.suggestions.length} suggestions`);

        result = {
          suggestions: aiResult.suggestions.map((message, index) => ({
            id: `ai-${index}`,
            message,
            source: 'ai',
          })),
          common_ground: aiResult.common_ground,
        };
      } catch (aiError) {
        this.logger.warn(`❌ AI generation failed: ${aiError.message}, falling back to common interests`);

        // 🔄 Fallback 1: Suggestions basées sur les points communs
        const commonInterests = this.findCommonInterests(currentUser, otherUser);

        if (commonInterests.length > 0) {
          this.logger.log(`💡 Generating suggestions based on ${commonInterests.length} common interests`);
          result = this.generateInterestBasedSuggestions(commonInterests, currentUser, otherUser);
        } else {
          // 🔄 Fallback 2: Suggestions prédéfinies universelles
          this.logger.log('📋 Using predefined universal conversation starters');
          result = this.getPredefinedSuggestions();
        }
      }

      // Sauvegarder en cache
      try {
        await this.conversationStartersCacheRepository.save({
          matchId,
          suggestions: result.suggestions,
          commonGround: result.common_ground,
        });
        this.logger.log(`💾 Cached conversation starters for match ${matchId}`);
      } catch (cacheError) {
        this.logger.warn(`⚠️ Failed to cache conversation starters: ${cacheError.message}`);
        // On continue même si le cache échoue
      }

      return result;
    } catch (error) {
      this.logger.error(`❌ Failed to generate conversation suggestions: ${error.message}`);

      // Dernier recours: suggestions prédéfinies
      return this.getPredefinedSuggestions();
    }
  }

  /**
   * Construit un profil utilisateur formaté pour le LLM
   */
  private buildUserProfileForLLM(user: User): string {
    const parts: string[] = [];

    if (user.firstName) {
      parts.push(`Prénom: ${user.firstName}`);
    }

    if (user.birthDate) {
      const age = this.calculateAge(new Date(user.birthDate));
      parts.push(`Âge: ${age} ans`);
    }

    if (user.city) {
      parts.push(`Ville: ${user.city}`);
    }

    if (user.bio) {
      parts.push(`Bio: ${user.bio}`);
    }

    if (user.alterSummary) {
      parts.push(`Résumé: ${user.alterSummary}`);
    }

    if (user.interests && user.interests.length > 0) {
      parts.push(`Intérêts: ${user.interests.join(', ')}`);
    }

    if (user.searchObjectives && user.searchObjectives.length > 0) {
      parts.push(`Recherche: ${user.searchObjectives.join(', ')}`);
    }

    return parts.join('\n');
  }

  /**
   * Calcule l'âge à partir de la date de naissance
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Trouve les intérêts communs entre deux utilisateurs
   */
  private findCommonInterests(user1: User, user2: User): string[] {
    const interests1 = user1.interests || [];
    const interests2 = user2.interests || [];
    return interests1.filter(interest => interests2.includes(interest));
  }

  /**
   * Génère des suggestions basées sur les intérêts communs
   */
  private generateInterestBasedSuggestions(commonInterests: string[], user1: User, user2: User) {
    const suggestions: string[] = [];

    // Prendre jusqu'à 3 intérêts communs et les transformer en thèmes
    const selectedInterests = commonInterests.slice(0, 3);

    for (const interest of selectedInterests) {
      // Transformer l'intérêt en thème de conversation
      suggestions.push(`Votre passion pour ${interest}`);
    }

    // Si moins de 3 suggestions, compléter avec des thèmes génériques
    if (suggestions.length < 3) {
      const genericThemes = [
        `Vos coups de cœur du moment`,
        `Les endroits qui vous inspirent`,
        `Vos prochaines aventures`,
      ];

      while (suggestions.length < 3 && genericThemes.length > 0) {
        suggestions.push(genericThemes.shift()!);
      }
    }

    return {
      suggestions: suggestions.map((message, index) => ({
        id: `interest-${index}`,
        message,
        source: 'common_interests',
      })),
      common_ground: commonInterests.join(', '),
    };
  }

  /**
   * Retourne des suggestions prédéfinies universelles
   */
  private getPredefinedSuggestions() {
    return {
      suggestions: [
        {
          id: 'predefined-0',
          message: "Vos destinations de rêve ✈️",
          source: 'predefined',
        },
        {
          id: 'predefined-1',
          message: "Les petits bonheurs du quotidien ☕",
          source: 'predefined',
        },
        {
          id: 'predefined-2',
          message: "Vos passions créatives 🎨",
          source: 'predefined',
        },
      ],
      common_ground: 'Thèmes universels',
    };
  }
}
