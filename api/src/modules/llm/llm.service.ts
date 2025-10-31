import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ParametersService } from '../parameters/parameters.service';
import { replacePlaceholders } from '../parameters/prompt-helper';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Nettoie et parse une réponse JSON du LLM
 * Gère les cas où le LLM entoure le JSON de backticks markdown
 */
function cleanAndParseJSON<T = any>(content: string, logger: Logger, context: string): T {
  let cleanedContent = content.trim();

  // Vérifier si le contenu commence par ```json et finit par ```
  if (cleanedContent.startsWith('```json')) {
    cleanedContent = cleanedContent.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
  } else if (cleanedContent.startsWith('```')) {
    // Cas où c'est juste ``` sans le "json"
    cleanedContent = cleanedContent.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  logger.debug(`Cleaned content for JSON parsing (${context})`);

  return JSON.parse(cleanedContent);
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly parametersService: ParametersService,
  ) {
    this.apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    const baseURL = this.configService.get<string>('OPENROUTER_BASE_URL') || 'https://openrouter.ai/api/v1';

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.configService.get<string>('APP_URL'),
        'X-Title': 'Alter Dating App',
      },
    });
  }

  /**
   * Appel générique au LLM via OpenRouter
   */
  async chat(
    messages: LlmMessage[],
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      jsonMode?: boolean;
    } = {},
  ): Promise<LlmResponse> {
    // Récupérer les valeurs par défaut depuis les paramètres
    const defaultModel = await this.parametersService.get<string>('llm.model');
    const defaultTemperature = await this.parametersService.get<number>('llm.temperature');
    const defaultMaxTokens = await this.parametersService.get<number>('llm.max_tokens');

    const {
      model = defaultModel,
      temperature = defaultTemperature,
      maxTokens = defaultMaxTokens,
      jsonMode = false,
    } = options;

    const requestPayload = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    };

    // Log détaillé de la requête
    this.logger.log('=== LLM REQUEST ===');
    this.logger.log(`Model: ${model}`);
    this.logger.log(`Temperature: ${temperature}`);
    this.logger.log(`Max Tokens: ${maxTokens}`);
    this.logger.log(`JSON Mode: ${jsonMode}`);
    this.logger.log('Messages:');
    messages.forEach((msg, index) => {
      this.logger.log(`  [${index}] ${msg.role}:`);
      this.logger.log(msg.content);
    });
    this.logger.log('===================');

    try {
      const response = await this.client.post('/chat/completions', requestPayload);

      const choice = response.data.choices[0];
      const usage = response.data.usage;

      // Log de la réponse
      this.logger.log('=== LLM RESPONSE ===');
      this.logger.log(`Tokens: ${usage?.total_tokens || 'N/A'} (prompt: ${usage?.prompt_tokens}, completion: ${usage?.completion_tokens})`);
      this.logger.log('Response:');
      this.logger.log(choice.message.content);
      this.logger.log('====================');

      return {
        content: choice.message.content,
        usage: usage ? {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;

      // Log détaillé de l'erreur
      this.logger.error('=== LLM API ERROR ===');
      this.logger.error(`Status Code: ${statusCode}`);
      this.logger.error(`Error Message: ${error.message}`);
      this.logger.error(`Error Data: ${JSON.stringify(errorData)}`);
      this.logger.error('=====================');

      // Messages d'erreur plus explicites
      if (statusCode === 402) {
        throw new Error(`LLM API payment required (402): Your OpenRouter account has insufficient credits. Please add credits at https://openrouter.ai/`);
      } else if (statusCode === 401) {
        throw new Error(`LLM API authentication failed (401): Check your OPENROUTER_API_KEY in .env file`);
      } else if (statusCode === 429) {
        throw new Error(`LLM API rate limit exceeded (429): Too many requests, please try again later`);
      } else {
        throw new Error(`LLM API call failed: ${error.message}`);
      }
    }
  }

  /**
   * Analyse de compatibilité entre deux utilisateurs
   */
  async analyzeCompatibility(
    user1Profile: string,
    user2Profile: string,
  ): Promise<{
    global: number;
    love: number;
    friendship: number;
    carnal: number;
    insight: string;
  }> {
    // Récupérer le prompt depuis les paramètres
    const promptTemplate = await this.parametersService.get<string>('prompts.compatibility_analysis');

    // Remplacer les placeholders
    const systemPrompt = replacePlaceholders(promptTemplate, {
      user1_profile: user1Profile,
      user2_profile: user2Profile,
    });

    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    const response = await this.chat(messages, {
      jsonMode: true,
      temperature: 0.5,
    });

    return cleanAndParseJSON(response.content, this.logger, 'compatibility analysis');
  }

  /**
   * Analyse de la qualité d'une conversation
   */
  async analyzeConversationQuality(
    conversationHistory: string,
  ): Promise<{ score: number; feedback: string }> {
    // Récupérer le prompt depuis les paramètres
    const promptTemplate = await this.parametersService.get<string>('prompts.conversation_quality');

    // Remplacer les placeholders
    const systemPrompt = replacePlaceholders(promptTemplate, {
      conversation_history: conversationHistory,
    });

    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    const response = await this.chat(messages, {
      jsonMode: true,
      temperature: 0.4,
    });

    return cleanAndParseJSON(response.content, this.logger, 'conversation quality');
  }

  /**
   * Calcul de l'âge à partir de la date de naissance
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
   * Génère une réponse pour Alter Chat
   */
  async generateAlterResponse(
    conversationHistory: LlmMessage[],
  ): Promise<string> {
    const systemMessage: LlmMessage = {
      role: 'system',
      content: `Tu es Alter, un assistant IA empathique d'une app de rencontres.
Aide l'utilisateur à créer un profil authentique en posant des questions ouvertes et intéressantes.
Sois chaleureux, encourageant et professionnel. Garde tes réponses concises (2-3 phrases max).`,
    };

    const messages = [systemMessage, ...conversationHistory];

    const response = await this.chat(messages, {
      temperature: 0.8,
      maxTokens: 500,
    });

    return response.content;
  }

  /**
   * Génère un message de partage personnalisé pour les réseaux sociaux
   */
  async generateShareMessage(userProfile: string): Promise<{ message: string }> {
    // Récupérer le prompt depuis les paramètres
    const promptTemplate = await this.parametersService.get<string>('prompts.profile_share_message');

    // Remplacer les placeholders
    const systemPrompt = replacePlaceholders(promptTemplate, {
      user_profile: userProfile,
    });

    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    const response = await this.chat(messages, {
      jsonMode: true,
      temperature: 0.8,
      maxTokens: 300,
    });

    try {
      return cleanAndParseJSON<{ message: string }>(response.content, this.logger, 'share message');
    } catch (error) {
      this.logger.error('Failed to parse share message response:', {
        error: error.message,
        content: response.content,
      });

      // Fallback: retourner un message générique
      return {
        message: "Je viens de rejoindre Alter ! Une nouvelle aventure commence 🌟"
      };
    }
  }

  /**
   * Génère une réponse structurée pour Alter Chat avec le nouveau prompt
   */
  async generateAlterStructuredResponse(
    conversationHistory: LlmMessage[],
    currentProfileState?: any,
    userData?: any,
  ): Promise<any> {
    // Récupérer le prompt depuis les paramètres
    const promptTemplate = await this.parametersService.get<string>('prompts.alter_system');

    // Récupérer les poids de complétion depuis les paramètres
    const maxQuestionsPerSession = await this.parametersService.get<number>('alter.max_questions_per_session');
    const personalityWeight = await this.parametersService.get<number>('alter.personality_weight');
    const intentionWeight = await this.parametersService.get<number>('alter.intention_weight');
    const identityWeight = await this.parametersService.get<number>('alter.identity_weight');
    const friendshipWeight = await this.parametersService.get<number>('alter.friendship_weight');
    const loveWeight = await this.parametersService.get<number>('alter.love_weight');
    const sexualityWeight = await this.parametersService.get<number>('alter.sexuality_weight');
    const bioWeight = await this.parametersService.get<number>('alter.bio_weight');

    // Construire la section d'informations connues
    let userKnownInfo = '';
    if (userData) {
      this.logger.log(`📋 User data for context: ${JSON.stringify({
        firstName: userData.firstName,
        searchObjectives: userData.searchObjectives,
        biologicalSex: userData.biologicalSex,
        sexualOrientation: userData.sexualOrientation,
      })}`);

      userKnownInfo = '\n\n## Informations déjà connues de l\'utilisateur\n\n';
      userKnownInfo += 'Voici les informations que nous connaissons déjà sur l\'utilisateur. Ne pose PAS de questions sur ces éléments :\n\n';

      if (userData.firstName) {
        userKnownInfo += `- Prénom : ${userData.firstName}\n`;
      }

      if (userData.birthDate) {
        const age = this.calculateAge(new Date(userData.birthDate));
        userKnownInfo += `- Âge : ${age} ans (né(e) le ${new Date(userData.birthDate).toLocaleDateString('fr-FR')})\n`;
      }

      if (userData.city) {
        userKnownInfo += `- Ville : ${userData.city}\n`;
      }

      if (userData.biologicalSex) {
        userKnownInfo += `- Sexe biologique : ${userData.biologicalSex}\n`;
      }

      if (userData.sexualOrientation) {
        userKnownInfo += `- Orientation sexuelle : ${userData.sexualOrientation}\n`;
      }

      if (userData.relationshipStatus) {
        userKnownInfo += `- Situation de couple : ${userData.relationshipStatus}\n`;
      }

      if (userData.searchObjectives && userData.searchObjectives.length > 0) {
        userKnownInfo += `- Objectifs de recherche : ${userData.searchObjectives.join(', ')}\n`;
      }

      if (userData.preferenceGenders && userData.preferenceGenders.length > 0) {
        userKnownInfo += `- Genre(s) recherché(s) : ${userData.preferenceGenders.join(', ')}\n`;
      }

      if (userData.preferenceAgeMin && userData.preferenceAgeMax) {
        userKnownInfo += `- Tranche d'âge recherchée : ${userData.preferenceAgeMin}-${userData.preferenceAgeMax} ans\n`;
      }

      if (userData.preferenceDistance) {
        userKnownInfo += `- Distance maximale : ${userData.preferenceDistance} km\n`;
      }

      if (userData.onboardingAnswers) {
        userKnownInfo += '\n**Réponses d\'onboarding supplémentaires :**\n';
        Object.entries(userData.onboardingAnswers).forEach(([key, value]) => {
          if (value && !['photos', 'firstName', 'birthDate', 'city', 'biologicalSex', 'sexualOrientation', 'relationshipStatus', 'searchObjectives', 'genderPreferences', 'preferenceAge', 'preferenceDistance'].includes(key)) {
            userKnownInfo += `- ${key} : ${JSON.stringify(value)}\n`;
          }
        });
      }

      userKnownInfo += '\n⚠️ **IMPORTANT** : Ces informations sont déjà enregistrées. Tu DOIS adapter tes questions en conséquence et ne JAMAIS redemander ces informations.\n';
    }

    // Remplacer tous les placeholders
    const systemPrompt = replacePlaceholders(promptTemplate, {
      max_questions_per_session: maxQuestionsPerSession,
      personality_weight: personalityWeight,
      intention_weight: intentionWeight,
      identity_weight: identityWeight,
      friendship_weight: friendshipWeight,
      love_weight: loveWeight,
      sexuality_weight: sexualityWeight,
      bio_weight: bioWeight,
      user_known_info: userKnownInfo,
    });

    const systemMessage: LlmMessage = {
      role: 'system',
      content: systemPrompt,
    };

    // Ajouter le contexte du profil actuel si disponible
    const messages = [systemMessage];

    if (currentProfileState) {
      // Calculer le contexte de progression depuis l'historique
      const lastStepMessage = conversationHistory
        .slice()
        .reverse()
        .find(msg => msg.role === 'assistant');

      let progressionContext = `État actuel du profil : ${JSON.stringify(currentProfileState)}`;

      // Ajouter le contexte de numérotation si disponible dans l'historique
      if (lastStepMessage) {
        try {
          const lastResponse = JSON.parse(lastStepMessage.content);
          if (lastResponse.question_number && lastResponse.step) {
            const [currentNum, total] = lastResponse.question_number.split('/').map(n => parseInt(n));
            progressionContext += `\n\n📍 CONTEXTE DE PROGRESSION :
- Étape actuelle : ${lastResponse.step}
- Dernière question posée : ${currentNum}/${total}
- Prochaine question à poser : ${currentNum + 1}/${total} (sauf si tu changes d'étape)

⚠️ IMPORTANT :
- Si tu continues sur la même étape "${lastResponse.step}", la prochaine question_number DOIT être "${currentNum + 1}/${total}"
- Si tu changes d'étape, recommence à "1/10"
- Ne saute JAMAIS de numéros et ne reviens JAMAIS en arrière dans la numérotation`;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      messages.push({
        role: 'system',
        content: progressionContext,
      });
    }

    messages.push(...conversationHistory);

    // Récupérer les paramètres spécifiques à Alter
    const alterModel = await this.parametersService.get<string>('llm.alter_model');
    const alterTemperature = await this.parametersService.get<number>('llm.alter_temperature');
    const alterMaxTokens = await this.parametersService.get<number>('llm.alter_max_tokens');

    this.logger.log(`🤖 Alter LLM Config: model=${alterModel}, temp=${alterTemperature}, maxTokens=${alterMaxTokens}`);

    const response = await this.chat(messages, {
      model: alterModel,
      temperature: alterTemperature,
      maxTokens: alterMaxTokens,
      jsonMode: true,
    });

    try {
      const parsed = cleanAndParseJSON(response.content, this.logger, 'alter structured response');

      // Validation et nettoyage du message
      if (parsed.message && typeof parsed.message === 'string') {
        // Nettoyer les espaces excessifs et vérifier que le message n'est pas vide
        parsed.message = parsed.message.trim();

        if (!parsed.message || parsed.message.length === 0) {
          this.logger.warn('Alter response has empty message after trim, retrying...');
          throw new Error('Empty message in response');
        }

        // Nettoyer les espaces multiples SANS toucher aux retours à la ligne
        // Remplacer les multiples espaces (mais pas les \n) par un seul espace
        parsed.message = parsed.message
          .split('\n')
          .map(line => line.replace(/[^\S\n]+/g, ' ').trim())
          .join('\n')
          .replace(/\n{3,}/g, '\n\n'); // Max 2 retours à la ligne consécutifs
      } else {
        this.logger.warn('Alter response missing message field');
        throw new Error('Missing message field');
      }

      // Validation et nettoyage des interests
      if (parsed.profile_state?.interests) {
        // Valider que c'est un tableau
        if (!Array.isArray(parsed.profile_state.interests)) {
          this.logger.warn('Interests is not an array, resetting to empty array');
          parsed.profile_state.interests = [];
        } else {
          // Nettoyer les valeurs vides et limiter à 10 intérêts max
          parsed.profile_state.interests = parsed.profile_state.interests
            .filter(interest => interest && typeof interest === 'string' && interest.trim())
            .map(interest => interest.trim())
            .slice(0, 10);
        }
      }

      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse or validate Alter response:', {
        error: error.message,
        content: response.content,
      });

      // Fallback: retourner une structure par défaut avec un message d'erreur approprié
      return {
        message: "Désolé, j'ai rencontré un petit problème. Peux-tu reformuler ta réponse ?",
        step: 'personnalite',
        expect_user_response: true,
        profile_state: {
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
      };
    }
  }
}
