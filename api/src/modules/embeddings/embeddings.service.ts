import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    // Utiliser OpenAI pour les embeddings
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not configured - embeddings will fail');
    }

    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Génère un embedding pour un texte donné
   * Modèle : text-embedding-3-small (1536 dimensions, $0.02/1M tokens)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot generate embedding for empty text');
    }

    try {
      const response = await this.client.post('/embeddings', {
        model: 'text-embedding-3-small',
        input: text,
      });

      // Vérifier que la réponse contient les données attendues
      if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
        this.logger.error('Invalid API response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('Invalid response from embeddings API');
      }

      const embedding = response.data.data[0].embedding;

      if (!embedding || !Array.isArray(embedding)) {
        this.logger.error('Invalid embedding in response:', JSON.stringify(response.data.data[0], null, 2));
        throw new Error('Invalid embedding format in API response');
      }

      this.logger.log(`Generated embedding (${embedding.length} dimensions)`);

      return embedding;
    } catch (error) {
      this.logger.error('Embedding generation failed:', error.response?.data || error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Calcule la similarité cosinus entre deux vecteurs
   * Retourne un score entre 0 (opposés) et 1 (identiques)
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB) {
      throw new Error('Vectors cannot be null or undefined');
    }

    if (vecA.length !== vecB.length) {
      throw new Error(`Vectors must have same dimension (got ${vecA.length} and ${vecB.length})`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Génère un embedding pour le profil utilisateur complet
   */
  async generateProfileEmbedding(user: any): Promise<number[]> {
    // Construire le texte du profil
    const profileText = this.buildProfileText(user);

    if (!profileText || profileText.trim().length === 0) {
      throw new Error('User profile is empty, cannot generate embedding');
    }

    // Générer l'embedding
    return this.generateEmbedding(profileText);
  }

  /**
   * Construit un texte représentatif du profil
   */
  private buildProfileText(user: any): string {
    const parts = [];

    // Utiliser le résumé ALTER en priorité
    if (user.alterSummary) {
      parts.push(user.alterSummary);
    }

    // Ajouter les données structurées ALTER
    if (user.alterProfileAI) {
      const ai = user.alterProfileAI;
      if (ai.personnalité) parts.push(`Personnalité: ${ai.personnalité}`);
      if (ai.intention) parts.push(`Intention: ${ai.intention}`);
      if (ai.identité) parts.push(`Identité: ${ai.identité}`);
      if (ai.amitié) parts.push(`Amitié: ${ai.amitié}`);
      if (ai.amour) parts.push(`Amour: ${ai.amour}`);
      if (ai.sexualité) parts.push(`Sexualité: ${ai.sexualité}`);
    }

    // Ajouter la bio si pas de données ALTER
    if (parts.length === 0 && user.bio) {
      parts.push(user.bio);
    }

    // Ajouter des métadonnées de base
    if (user.birthDate) {
      parts.push(`Âge: ${this.calculateAge(user.birthDate)} ans`);
    }
    if (user.city) parts.push(`Ville: ${user.city}`);
    if (user.searchObjectives && user.searchObjectives.length > 0) {
      parts.push(`Recherche: ${user.searchObjectives.join(', ')}`);
    }
    if (user.interests && user.interests.length > 0) {
      parts.push(`Centres d'intérêt: ${user.interests.join(', ')}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Calcule l'âge à partir de la date de naissance
   */
  private calculateAge(birthDate: Date | string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
