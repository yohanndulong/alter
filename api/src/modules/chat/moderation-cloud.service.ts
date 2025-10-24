import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { readFileSync } from 'fs';

export interface CloudModerationResult {
  isSafe: boolean;
  adult: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  violence: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  racy: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  confidence: number;
}

/**
 * Service de modération utilisant Google Vision API
 * Plus précis (96%) mais payant (~$1.50/1000 images)
 *
 * Configuration requise:
 * 1. Créer un projet sur https://console.cloud.google.com/
 * 2. Activer Vision API
 * 3. Créer une clé API
 * 4. Ajouter GOOGLE_VISION_API_KEY dans .env
 */
@Injectable()
export class CloudModerationService {
  private readonly logger = new Logger(CloudModerationService.name);
  private readonly apiKey: string;
  private readonly enabled: boolean;

  constructor() {
    this.apiKey = process.env.GOOGLE_VISION_API_KEY || '';
    this.enabled = !!this.apiKey;

    if (!this.enabled) {
      this.logger.warn('⚠️  GOOGLE_VISION_API_KEY non défini - Modération cloud désactivée');
    } else {
      this.logger.log('✅ Google Vision API moderation enabled');
    }
  }

  /**
   * Modère une image avec Google Vision API
   */
  async moderateImage(imagePath: string): Promise<CloudModerationResult> {
    if (!this.enabled) {
      return {
        isSafe: true,
        adult: 'VERY_UNLIKELY',
        violence: 'VERY_UNLIKELY',
        racy: 'VERY_UNLIKELY',
        confidence: 0,
      };
    }

    try {
      // Lire l'image et la convertir en base64
      const imageBuffer = readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Appeler Google Vision API
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'SAFE_SEARCH_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        },
        {
          timeout: 10000, // 10 secondes
        },
      );

      const safeSearch = response.data.responses[0].safeSearchAnnotation;

      const adult = safeSearch.adult || 'VERY_UNLIKELY';
      const violence = safeSearch.violence || 'VERY_UNLIKELY';
      const racy = safeSearch.racy || 'VERY_UNLIKELY';

      // Déterminer si l'image est sûre
      const isSafe =
        !['LIKELY', 'VERY_LIKELY'].includes(adult) &&
        !['LIKELY', 'VERY_LIKELY'].includes(racy);

      if (!isSafe) {
        this.logger.warn(`⚠️  Unsafe content detected: adult=${adult}, racy=${racy}, violence=${violence}`);
      } else {
        this.logger.log(`✅ Image passed cloud moderation`);
      }

      return {
        isSafe,
        adult,
        violence,
        racy,
        confidence: 0.96, // Google Vision a ~96% de précision
      };
    } catch (error) {
      this.logger.error(`❌ Cloud moderation error: ${error.message}`);

      // En cas d'erreur, considérer comme sûre
      return {
        isSafe: true,
        adult: 'VERY_UNLIKELY',
        violence: 'VERY_UNLIKELY',
        racy: 'VERY_UNLIKELY',
        confidence: 0,
      };
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
