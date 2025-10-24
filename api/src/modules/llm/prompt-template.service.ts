import { Injectable } from '@nestjs/common';
import { ParametersService } from '../parameters/parameters.service';

export interface PromptTemplate {
  system: string;
  user: string;
}

@Injectable()
export class PromptTemplateService {
  constructor(private readonly parametersService: ParametersService) {}

  /**
   * Remplace les variables dans un template par les valeurs fournies
   */
  private interpolate(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  /**
   * Récupère et interpole un template de prompt depuis la DB
   */
  async getPrompt(
    key: string,
    variables: Record<string, any> = {},
  ): Promise<PromptTemplate> {
    const template = await this.parametersService.get<PromptTemplate>(key);

    if (!template) {
      throw new Error(`Prompt template '${key}' not found`);
    }

    return {
      system: this.interpolate(template.system, variables),
      user: this.interpolate(template.user, variables),
    };
  }

  /**
   * Templates par défaut pour initialisation
   */
  getDefaultTemplates(): Record<string, PromptTemplate> {
    return {
      // Conversation avec Alter
      'alter_chat': {
        system: `Tu es Alter, un assistant IA empathique et bienveillant d'une application de rencontres.
Ton rôle est d'aider les utilisateurs à mieux se connaître et à créer des profils authentiques.
Tu poses des questions ouvertes et intéressantes pour comprendre leur personnalité, leurs valeurs et leurs aspirations.
Sois chaleureux, encourageant et professionnel.`,
        user: `Contexte utilisateur:
Nom: {{userName}}
Âge: {{userAge}}
Genre: {{userGender}}
Réponses précédentes: {{previousAnswers}}

Message de l'utilisateur: {{userMessage}}`,
      },

      // Calcul de compatibilité
      'compatibility_scoring': {
        system: `Tu es un expert en psychologie relationnelle et en analyse de compatibilité.
Analyse les profils de deux personnes et calcule leur compatibilité sur différents aspects.
Retourne un JSON avec les scores et une explication courte.`,
        user: `Profil utilisateur 1:
{{user1Profile}}

Profil utilisateur 2:
{{user2Profile}}

Calcule la compatibilité sur ces dimensions:
- Global (score général de compatibilité)
- Love (potentiel relationnel amoureux)
- Friendship (potentiel d'amitié)
- Carnal (compatibilité physique/attraction)

Retourne un JSON avec cette structure:
{
  "global": 85,
  "love": 90,
  "friendship": 88,
  "carnal": 82,
  "insight": "Explication courte et engageante de la compatibilité"
}`,
      },

      // Analyse de qualité de conversation
      'conversation_quality': {
        system: `Tu es un analyste de conversation expert en communication interpersonnelle.
Analyse la qualité d'une conversation entre deux personnes sur une app de rencontres.
Évalue l'engagement, l'authenticité, la réciprocité et le potentiel de connexion.`,
        user: `Historique de la conversation:
{{conversationHistory}}

Analyse cette conversation et retourne un score de qualité entre 0 et 100, ainsi qu'un feedback constructif.
Retourne un JSON:
{
  "score": 75,
  "feedback": "Analyse courte de la conversation"
}`,
      },

      // Insight de compatibilité entre utilisateurs
      'compatibility_insight': {
        system: `Tu es un conseiller en relations qui génère des insights personnalisés sur la compatibilité entre deux personnes.
Crée un message court, positif et engageant qui met en avant leurs points communs ou leur complémentarité.`,
        user: `Utilisateur 1:
{{user1Profile}}

Utilisateur 2:
{{user2Profile}}

Génère un insight court (1-2 phrases) qui explique pourquoi ils sont compatibles.
Utilise un ton chaleureux et encourageant. Ajoute un emoji pertinent.`,
      },
    };
  }
}
