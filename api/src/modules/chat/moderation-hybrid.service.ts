import { Injectable, Logger } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { CloudModerationService } from './moderation-cloud.service';

export interface HybridModerationResult {
  isSafe: boolean;
  method: 'local' | 'cloud' | 'hybrid';
  localScore?: number;
  cloudConfidence?: number;
  warnings: string[];
}

/**
 * Service de modération hybride
 *
 * Stratégie intelligente:
 * 1. Analyse RAPIDE avec NSFW.js (local, gratuit)
 * 2. Si score ambigu (40-70%), double-check avec API cloud (précis, payant)
 * 3. Si score clair (<40% ou >70%), on fait confiance au local
 *
 * Avantages:
 * - Réduit les coûts (seulement 20-30% des images vont au cloud)
 * - Améliore la précision sur les cas difficiles
 * - Reste rapide pour les cas évidents
 */
@Injectable()
export class HybridModerationService {
  private readonly logger = new Logger(HybridModerationService.name);

  constructor(
    private readonly localModeration: ModerationService,
    private readonly cloudModeration: CloudModerationService,
  ) {}

  /**
   * Modère une image avec stratégie hybride
   */
  async moderateImage(imagePath: string): Promise<HybridModerationResult> {
    // Étape 1: Analyse locale RAPIDE (gratuite)
    const localResult = await this.localModeration.moderateImage(imagePath);

    const localScore = Math.max(
      localResult.pornScore || 0,
      localResult.sexyScore || 0,
      localResult.hentaiScore || 0,
    );

    // Cas clair: score très bas (< 40%) = SAFE
    if (localScore < 0.4) {
      this.logger.log(`✅ Image clearly safe (local: ${(localScore * 100).toFixed(1)}%) - No cloud check needed`);
      return {
        isSafe: true,
        method: 'local',
        localScore,
        warnings: [],
      };
    }

    // Cas clair: score très haut (> 75%) = UNSAFE
    if (localScore > 0.75) {
      this.logger.warn(`⚠️  Image clearly unsafe (local: ${(localScore * 100).toFixed(1)}%) - No cloud check needed`);
      return {
        isSafe: false,
        method: 'local',
        localScore,
        warnings: localResult.warnings,
      };
    }

    // Cas AMBIGU (40-75%): Double-check avec API cloud
    if (this.cloudModeration.isEnabled()) {
      this.logger.log(`🔍 Ambiguous result (local: ${(localScore * 100).toFixed(1)}%) - Checking with cloud API...`);

      const cloudResult = await this.cloudModeration.moderateImage(imagePath);

      // Décision finale basée sur le cloud (plus précis)
      return {
        isSafe: cloudResult.isSafe,
        method: 'hybrid',
        localScore,
        cloudConfidence: cloudResult.confidence,
        warnings: cloudResult.isSafe ? [] : ['cloud_moderation_failed'],
      };
    }

    // Pas d'API cloud disponible, on utilise juste le résultat local
    this.logger.warn(`⚠️  Ambiguous result (local: ${(localScore * 100).toFixed(1)}%) - No cloud API available`);
    return {
      isSafe: localResult.isSafe,
      method: 'local',
      localScore,
      warnings: localResult.warnings,
    };
  }

  /**
   * Statistiques de modération
   */
  async getStats(): Promise<{
    localOnly: number;
    cloudChecks: number;
    costSavings: string;
  }> {
    // TODO: Implémenter le tracking des stats
    return {
      localOnly: 0,
      cloudChecks: 0,
      costSavings: '$0.00',
    };
  }
}
