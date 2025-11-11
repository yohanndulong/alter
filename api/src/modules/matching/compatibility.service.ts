import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CompatibilityCache } from './entities/compatibility-cache.entity';
import { User } from '../users/entities/user.entity';
import { LlmService } from '../llm/llm.service';
import { calculateProfileHash } from '../../utils/profile-hash.util';

export interface CompatibilityScores {
  global: number;
  love: number;
  friendship: number;
  carnal: number;
  insight: string;
  embeddingScore?: number;
}

@Injectable()
export class CompatibilityService {
  private readonly logger = new Logger(CompatibilityService.name);

  constructor(
    @InjectRepository(CompatibilityCache)
    private readonly cacheRepository: Repository<CompatibilityCache>,
    private readonly llmService: LlmService,
  ) {}

  /**
   * Récupère le cache de compatibilité entre deux utilisateurs
   */
  async getCache(
    userId: string,
    targetUserId: string,
    userHash: string,
    targetHash: string,
  ): Promise<CompatibilityCache | null> {
    const cache = await this.cacheRepository.findOne({
      where: {
        userId,
        targetUserId,
        userProfileHash: userHash,
        targetProfileHash: targetHash,
      },
    });

    if (!cache) {
      this.logger.debug(`Cache miss for ${userId} -> ${targetUserId}`);
      return null;
    }

    // Vérifier l'expiration
    if (cache.expiresAt && new Date() > cache.expiresAt) {
      this.logger.debug(`Cache expired for ${userId} -> ${targetUserId}`);
      return null;
    }

    this.logger.debug(`Cache hit for ${userId} -> ${targetUserId}`);
    return cache;
  }

  /**
   * Sauvegarde un cache de compatibilité
   * ✨ OPTIMISATION : TTL de 30 jours pour laisser expirer naturellement les vieux caches
   * Stratégie : Les profils changent peu après discussion avec ALTER
   * → Cache valide longtemps, invalidation seulement si profil change vraiment
   */
  async saveCache(
    userId: string,
    targetUserId: string,
    scores: CompatibilityScores,
    userHash: string,
    targetHash: string,
  ): Promise<CompatibilityCache> {
    // Définir une date d'expiration à 30 jours
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const cache = this.cacheRepository.create({
      userId,
      targetUserId,
      scoreGlobal: scores.global,
      scoreLove: scores.love,
      scoreFriendship: scores.friendship,
      scoreCarnal: scores.carnal,
      compatibilityInsight: scores.insight,
      userProfileHash: userHash,
      targetProfileHash: targetHash,
      embeddingScore: scores.embeddingScore,
      expiresAt, // 30 jours de validité
    });

    try {
      return await this.cacheRepository.save(cache);
    } catch (error) {
      // Si erreur de contrainte unique (race condition), récupérer depuis le cache
      if (error.code === '23505') {
        this.logger.debug(
          `Cache already exists for ${userId} -> ${targetUserId} (race condition), fetching from DB`,
        );
        const existing = await this.cacheRepository.findOne({
          where: { userId, targetUserId },
        });
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  /**
   * Récupère ou calcule la compatibilité entre deux utilisateurs
   * C'est la méthode principale utilisée par le matching service
   */
  async getOrCalculate(
    user: User,
    target: User,
    embeddingScore?: number,
  ): Promise<CompatibilityScores> {
    // Calculer les hash des profils
    const userHash = calculateProfileHash(user);
    const targetHash = calculateProfileHash(target);

    // Vérifier le cache
    const cached = await this.getCache(user.id, target.id, userHash, targetHash);

    if (cached) {
      return {
        global: cached.scoreGlobal,
        love: cached.scoreLove || 0,
        friendship: cached.scoreFriendship || 0,
        carnal: cached.scoreCarnal || 0,
        insight: cached.compatibilityInsight || '',
        embeddingScore: cached.embeddingScore,
      };
    }

    // Cache miss : calculer avec LLM
    this.logger.log(`🤖 Calculating compatibility: ${user.id} -> ${target.id}`);
    const scores = await this.calculateWithLLM(user, target);

    // Ajouter le score d'embedding s'il est fourni
    scores.embeddingScore = embeddingScore;

    // Sauvegarder en cache
    await this.saveCache(user.id, target.id, scores, userHash, targetHash);

    return scores;
  }

  /**
   * Calcule la compatibilité via le LLM
   */
  private async calculateWithLLM(
    user: User,
    target: User,
  ): Promise<CompatibilityScores> {
    // Formater les profils pour le LLM
    const user1Profile = this.formatProfileForLLM(user);
    const user2Profile = this.formatProfileForLLM(target);

    try {
      const result = await this.llmService.analyzeCompatibility(
        user1Profile,
        user2Profile,
      );

      return result;
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';

      // Détection d'erreur de paiement
      if (errorMessage.includes('402') || errorMessage.includes('payment required')) {
        this.logger.error(`❌ LLM API payment error - Cannot calculate compatibility`);
        this.logger.error(`📌 Action required: Add credits to your OpenRouter account at https://openrouter.ai/`);

        // Retourner un score neutre avec un message explicite
        return {
          global: 50,
          love: 50,
          friendship: 50,
          carnal: 50,
          insight: '⚠️ Service temporairement indisponible. Les scores de compatibilité seront calculés dès que possible.',
        };
      }

      this.logger.error(`Failed to calculate compatibility: ${errorMessage}`);

      // Pour les autres erreurs, retourner des scores par défaut plus optimistes
      return {
        global: 70,
        love: 65,
        friendship: 70,
        carnal: 60,
        insight: 'Analyse de compatibilité en cours... Les scores seront affinés prochainement.',
      };
    }
  }

  /**
   * Formate un profil utilisateur pour le LLM
   */
  private formatProfileForLLM(user: User): string {
    const parts: string[] = [];

    parts.push(`**Profil : ${user.firstName || 'Utilisateur'}, ${user.age} ans**`);
    parts.push(`Genre : ${user.gender}`);

    if (user.sexualOrientation) {
      parts.push(`Orientation sexuelle : ${user.sexualOrientation}`);
    }

    if (user.bio) {
      parts.push(`\nBio : ${user.bio}`);
    }

    if (user.interests && user.interests.length > 0) {
      parts.push(`\nIntérêts : ${user.interests.join(', ')}`);
    }

    if (user.searchObjectives && user.searchObjectives.length > 0) {
      parts.push(`\nObjectifs de recherche : ${user.searchObjectives.join(', ')}`);
    }

    if (user.alterProfileAI) {
      parts.push('\n**Profil IA** :');
      if (user.alterProfileAI.personnalité) {
        parts.push(`- Personnalité : ${user.alterProfileAI.personnalité}`);
      }
      if (user.alterProfileAI.intention) {
        parts.push(`- Intention : ${user.alterProfileAI.intention}`);
      }
      if (user.alterProfileAI.identité) {
        parts.push(`- Identité : ${user.alterProfileAI.identité}`);
      }
      if (user.alterProfileAI.amitié) {
        parts.push(`- Amitié : ${user.alterProfileAI.amitié}`);
      }
      if (user.alterProfileAI.amour) {
        parts.push(`- Amour : ${user.alterProfileAI.amour}`);
      }
      if (user.alterProfileAI.sexualité) {
        parts.push(`- Sexualité : ${user.alterProfileAI.sexualité}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Invalide le cache pour un utilisateur
   * Appelé lorsque le profil de l'utilisateur est modifié
   */
  async invalidateUserCache(userId: string): Promise<number> {
    const result = await this.cacheRepository.delete([
      { userId },
      { targetUserId: userId },
    ]);

    const count = (result.affected || 0);
    this.logger.log(`Invalidated ${count} cache entries for user ${userId}`);
    return count;
  }

  /**
   * Récupère les statistiques du cache
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    const totalEntries = await this.cacheRepository.count();

    const oldest = await this.cacheRepository.findOne({
      order: { calculatedAt: 'ASC' },
    });

    const newest = await this.cacheRepository.findOne({
      order: { calculatedAt: 'DESC' },
    });

    return {
      totalEntries,
      oldestEntry: oldest?.calculatedAt || null,
      newestEntry: newest?.calculatedAt || null,
    };
  }

  /**
   * Calcule la compatibilité pour plusieurs profils en batch
   * Optimisation : vérifie tous les caches d'abord, puis calcule seulement ce qui manque
   */
  async calculateBatch(
    user: User,
    targets: User[],
    embeddingScores?: Map<string, number>,
  ): Promise<Map<string, CompatibilityScores>> {
    const results = new Map<string, CompatibilityScores>();
    const toCalculate: User[] = [];
    const userHash = calculateProfileHash(user);

    // ✨ OPTIMISATION : Pré-calculer tous les hash UNE SEULE FOIS
    // Avant: O(n²) avec targets.find() dans la boucle | Après: O(n)
    const targetHashMap = new Map<string, string>();
    targets.forEach(target => {
      targetHashMap.set(target.id, calculateProfileHash(target));
    });

    // Vérifier les caches en une seule requête
    const targetIds = targets.map(t => t.id);
    const caches = await this.cacheRepository.find({
      where: {
        userId: user.id,
        targetUserId: In(targetIds),
        userProfileHash: userHash,
      },
    });

    // Créer une map des caches par targetUserId
    const cacheMap = new Map<string, CompatibilityCache>();
    caches.forEach(cache => {
      const targetHash = targetHashMap.get(cache.targetUserId);
      if (targetHash && cache.targetProfileHash === targetHash) {
        cacheMap.set(cache.targetUserId, cache);
      }
    });

    // Séparer ceux qui ont un cache valide de ceux à calculer
    for (const target of targets) {
      const cached = cacheMap.get(target.id);
      if (cached) {
        results.set(target.id, {
          global: cached.scoreGlobal,
          love: cached.scoreLove || 0,
          friendship: cached.scoreFriendship || 0,
          carnal: cached.scoreCarnal || 0,
          insight: cached.compatibilityInsight || '',
          embeddingScore: cached.embeddingScore,
        });
      } else {
        toCalculate.push(target);
      }
    }

    this.logger.log(
      `Batch: ${caches.length} cache hits, ${toCalculate.length} to calculate`,
    );

    // ✨ OPTIMISATION : Calculer les manquants EN PARALLÈLE au lieu de séquentiellement
    // Avant: 15 calculs × 3s = 45s | Après: max(3s) = 3-5s
    if (toCalculate.length > 0) {
      const calculations = toCalculate.map(async (target) => {
        const embeddingScore = embeddingScores?.get(target.id);
        const scores = await this.getOrCalculate(user, target, embeddingScore);
        return { targetId: target.id, scores };
      });

      const calculatedScores = await Promise.all(calculations);
      calculatedScores.forEach(({ targetId, scores }) => {
        results.set(targetId, scores);
      });

      this.logger.log(`✅ Calculated ${toCalculate.length} compatibility scores in parallel`);
    }

    return results;
  }

  /**
   * Nettoie les caches expirés
   * À appeler périodiquement (cron job)
   */
  async cleanExpiredCaches(): Promise<number> {
    const result = await this.cacheRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt IS NOT NULL AND expiresAt < NOW()')
      .execute();

    const count = result.affected || 0;
    this.logger.log(`Cleaned ${count} expired cache entries`);
    return count;
  }
}
