import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlterMessage, MessageRole, SelectionType } from './entities/alter-message.entity';
import { LlmService, LlmMessage } from '../llm/llm.service';
import { UsersService } from '../users/users.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class AlterChatService {
  private readonly logger = new Logger(AlterChatService.name);

  constructor(
    @InjectRepository(AlterMessage)
    private readonly alterMessageRepository: Repository<AlterMessage>,
    private readonly llmService: LlmService,
    private readonly usersService: UsersService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  async getMessages(userId: string): Promise<AlterMessage[]> {
    const messages = await this.alterMessageRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    // Si aucun message, créer le message de bienvenue initial
    if (messages.length === 0) {
      const welcomeMessage = await this.createWelcomeMessage(userId);
      return [welcomeMessage];
    }

    // Vérifier si le premier message est le message de bienvenue avec l'ancien format
    // (sans retours à la ligne)
    const firstMessage = messages[0];
    if (
      messages.length === 1 &&
      firstMessage.role === MessageRole.ASSISTANT &&
      firstMessage.content.includes('Je suis ALTER') &&
      !firstMessage.content.includes('\n')
    ) {
      // L'ancien message de bienvenue existe sans retours à la ligne, le supprimer et recréer
      this.logger.log(`Recreating welcome message for user ${userId} (old format detected)`);
      await this.alterMessageRepository.delete({ id: firstMessage.id });
      const welcomeMessage = await this.createWelcomeMessage(userId);
      return [welcomeMessage];
    }

    return messages;
  }

  /**
   * Crée le message de bienvenue initial avec 2 options de réponse
   */
  private async createWelcomeMessage(userId: string): Promise<AlterMessage> {
    const welcomeMessage = this.alterMessageRepository.create({
      userId,
      role: MessageRole.ASSISTANT,
      content: `Bonjour ! Je suis ALTER, ton assistant personnel pour t'aider à créer un profil authentique et significatif.

À travers notre échange, je vais apprendre à te connaître en profondeur pour :

✨ **Créer ton profil unique** : Je vais transformer nos conversations en un profil qui te ressemble vraiment, bien au-delà des simples cases à cocher.

💡 **Comprendre tes intentions** : Que tu cherches l'amour, l'amitié ou des rencontres plus légères, je m'adapte à ce que tu recherches vraiment.

🎯 **Te proposer des matchs pertinents** : Grâce à notre échange, je pourrai te suggérer des personnes vraiment compatibles avec qui tu as des affinités réelles.

🔒 **En toute confidentialité** : Cette conversation reste entre nous. Je l'utilise uniquement pour mieux te comprendre et affiner ton profil.

Notre discussion est libre et naturelle - il n'y a pas de bonnes ou mauvaises réponses. Prends ton temps, sois toi-même.

Es-tu prêt(e) à commencer ?`,
      options: ['Oui, discutons !', 'Non, plus tard'],
      selectionType: SelectionType.SINGLE,
      structuredData: null,
      profileState: {
        bio: '',
        completion: 0,
        summary: '',
        interests: [],
        profileAI: {
          personnalité: null,
          intention: null,
          identité: null,
          amitié: null,
          amour: null,
          sexualité: null,
        },
      },
    });

    return this.alterMessageRepository.save(welcomeMessage);
  }

  async getCurrentProfileState(userId: string): Promise<any> {
    const lastMessage = await this.alterMessageRepository.findOne({
      where: { userId, role: MessageRole.ASSISTANT },
      order: { createdAt: 'DESC' },
    });

    return lastMessage?.profileState || {
      bio: '',
      completion: 0,
      summary: '',
      interests: [],
      profileAI: {
        personnalité: null,
        intention: null,
        identité: null,
        amitié: null,
        amour: null,
        sexualité: null,
      },
    };
  }

  /**
   * Réinitialise complètement le chat ALTER pour un utilisateur
   * - Supprime tous les messages ALTER
   * - Réinitialise les données du profil ALTER (summary, profileAI, embedding)
   * - Garde le statut onboardingComplete intact
   */
  async resetAlterChat(userId: string): Promise<void> {
    this.logger.log(`Resetting ALTER chat for user ${userId}`);

    // Supprimer tous les messages ALTER
    await this.alterMessageRepository.delete({ userId });

    // Réinitialiser les données utilisateur liées à ALTER
    await this.usersService.update(userId, {
      alterSummary: null,
      alterProfileCompletion: 0,
      alterProfileAI: null,
      profileEmbedding: null,
      profileEmbeddingUpdatedAt: null,
    });

    this.logger.log(`ALTER chat reset completed for user ${userId}`);
  }

  async sendMessage(userId: string, content: string): Promise<AlterMessage> {
    // Sauvegarder le message utilisateur
    const userMessage = this.alterMessageRepository.create({
      userId,
      role: MessageRole.USER,
      content,
    });
    await this.alterMessageRepository.save(userMessage);

    // Vérifier si l'utilisateur répond "Non, plus tard" au message de bienvenue
    const messageCount = await this.alterMessageRepository.count({ where: { userId } });
    if (messageCount === 2 && content.toLowerCase().includes('non')) {
      // C'est le premier message utilisateur après le message de bienvenue
      // et il a répondu non
      const postponeMessage = this.alterMessageRepository.create({
        userId,
        role: MessageRole.ASSISTANT,
        content: `Pas de problème ! Je comprends que ce n'est peut-être pas le bon moment.

Je serai là quand tu seras prêt(e) à discuter. Reviens me voir quand tu le souhaites, on pourra commencer tranquillement.

À bientôt ! 😊`,
        options: null,
        selectionType: null,
        structuredData: null,
        profileState: {
          bio: '',
          completion: 0,
          summary: '',
          interests: [],
          profileAI: {
            personnalité: null,
            intention: null,
            identité: null,
            amitié: null,
            amour: null,
            sexualité: null,
          },
        },
      });
      return this.alterMessageRepository.save(postponeMessage);
    }

    // ✅ OPTIMISATION : Récupérer les 30 derniers messages pour garder le contexte
    const recentMessages = await this.alterMessageRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30, // Augmenté de 10 à 30 pour éviter les répétitions
    });
    // Remettre dans l'ordre chronologique
    recentMessages.reverse();

    const llmHistory: LlmMessage[] = recentMessages.map(msg => {
      // Pour les messages assistant, utiliser la question si disponible
      let content = msg.content;
      if (msg.role === MessageRole.ASSISTANT && msg.structuredData?.question) {
        content = msg.structuredData.question;
      }

      return {
        role: msg.role === MessageRole.USER ? 'user' : 'assistant',
        content: content,
      };
    });

    this.logger.log(`📊 Sending ${recentMessages.length} messages to LLM for user ${userId}`);

    // Récupérer le profile_state actuel
    const currentProfileState = await this.getCurrentProfileState(userId);

    // Récupérer les informations de l'utilisateur
    const user = await this.usersService.findById(userId);

    // Générer la réponse structurée d'Alter
    const alterResponse = await this.llmService.generateAlterStructuredResponse(
      llmHistory,
      currentProfileState,
      user,
    );

    // Extraire les données structurées
    const {
      message,
      response_format,
      profile_state,
      ...structuredData
    } = alterResponse;

    // Sauvegarder la réponse
    const assistantMessage = this.alterMessageRepository.create({
      userId,
      role: MessageRole.ASSISTANT,
      content: message || alterResponse.message || 'Pas de message',
      options: response_format?.options || null,
      selectionType: response_format?.type === 'single_choice' ? SelectionType.SINGLE :
                     response_format?.type === 'multi_choice' ? SelectionType.MULTIPLE :
                     response_format?.type === 'free_text' ? SelectionType.FREETEXT : null,
      structuredData: structuredData,
      profileState: profile_state || currentProfileState,
    });
    await this.alterMessageRepository.save(assistantMessage);

    // Synchroniser le profileState vers User pour le matching
    const finalProfileState = profile_state || currentProfileState;
    if (finalProfileState) {
      await this.usersService.update(userId, {
        bio: finalProfileState.bio || null,
        alterSummary: finalProfileState.summary || null,
        alterProfileCompletion: finalProfileState.completion || 0,
        alterProfileAI: finalProfileState.profileAI || null,
        interests: finalProfileState.interests || null,
      });

      // ✅ NOUVEAU : Générer l'embedding si le profil est suffisamment complété
      if (finalProfileState.completion >= 30) {
        await this.updateProfileEmbedding(userId);
      }
    }

    return assistantMessage;
  }

  /**
   * Met à jour l'embedding du profil utilisateur
   */
  private async updateProfileEmbedding(userId: string): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);

      // Vérifier qu'il y a assez de données
      if (!user.alterSummary && !user.alterProfileAI && !user.bio) {
        this.logger.warn(`Cannot generate embedding for user ${userId}: profile too empty`);
        return;
      }

      // Générer le nouvel embedding
      const embedding = await this.embeddingsService.generateProfileEmbedding(user);

      // Sauvegarder
      await this.usersService.update(userId, {
        profileEmbedding: embedding,
        profileEmbeddingUpdatedAt: new Date(),
      });

      this.logger.log(`✅ Profile embedding updated for user ${userId} (completion: ${user.alterProfileCompletion}%)`);
    } catch (error) {
      this.logger.error(`Failed to update embedding for user ${userId}:`, error.message);
      // Ne pas bloquer si l'embedding échoue
    }
  }
}
