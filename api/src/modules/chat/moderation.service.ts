import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';
import { createCanvas, loadImage } from 'canvas';

export interface ModerationResult {
  isSafe: boolean;
  pornScore?: number;
  sexyScore?: number;
  hentaiScore?: number;
  neutralScore?: number;
  warnings: string[];
}

@Injectable()
export class ModerationService implements OnModuleInit {
  private readonly logger = new Logger(ModerationService.name);
  private model: nsfwjs.NSFWJS | null = null;
  private isLoading = false;
  private enabled = true; // Toujours activé car c'est gratuit et local

  async onModuleInit() {
    // Charger le modèle au démarrage
    this.loadModel();
  }

  /**
   * Charge le modèle NSFW.js
   */
  private async loadModel() {
    if (this.model || this.isLoading) return;

    this.isLoading = true;
    this.logger.log('🤖 Loading NSFW.js model...');

    try {
      // Définir le backend TensorFlow (CPU pour Node.js)
      await tf.ready();

      // Charger le modèle NSFW.js avec InceptionV3 (plus précis mais plus lourd)
      // Options: 'MobilenetV2' (rapide, ~4.5MB), 'InceptionV3' (précis, ~23MB)
      this.model = await nsfwjs.load('InceptionV3');

      this.logger.log('✅ NSFW.js model loaded successfully');
      this.enabled = true;
    } catch (error) {
      this.logger.error(`❌ Failed to load NSFW.js model: ${error.message}`);
      this.enabled = false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Modère une image pour détecter du contenu sensible
   */
  async moderateImage(imagePath: string): Promise<ModerationResult> {
    if (!this.enabled || !this.model) {
      this.logger.warn('Moderation disabled or model not loaded, returning default safe result');
      return {
        isSafe: true,
        warnings: [],
      };
    }

    try {
      // Charger l'image avec canvas
      const image = await loadImage(imagePath);

      // Redimensionner l'image pour de meilleures performances et précision
      // Le modèle fonctionne mieux avec des images de taille raisonnable (224x224 ou 299x299)
      const targetSize = 299; // Pour InceptionV3
      const scale = Math.min(targetSize / image.width, targetSize / image.height);
      const width = Math.floor(image.width * scale);
      const height = Math.floor(image.height * scale);

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Améliorer la qualité de rendu
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(image, 0, 0, width, height);

      this.logger.log(`🔍 Analyzing image: ${imagePath} (${width}x${height})`);

      // Analyser l'image avec NSFW.js (avec plus de précisions)
      const predictions = await this.model.classify(canvas as any, 3); // Top 3 prédictions

      // Convertir les prédictions en objet
      const scores = predictions.reduce((acc, pred) => {
        acc[pred.className] = pred.probability;
        return acc;
      }, {} as Record<string, number>);

      const pornScore = scores.Porn || 0;
      const sexyScore = scores.Sexy || 0;
      const hentaiScore = scores.Hentai || 0;
      const neutralScore = scores.Neutral || 0;

      const warnings: string[] = [];
      let isSafe = true;

      // Seuils de détection (ajustables selon vos besoins)
      const PORN_THRESHOLD = 0.7; // 70% - Plus strict
      const SEXY_THRESHOLD = 0.8; // 80% - Plus strict
      const HENTAI_THRESHOLD = 0.7; // 70% - Plus strict

      // Ajouter un seuil combiné pour détecter les cas limites
      const COMBINED_THRESHOLD = 0.5; // 50% - Porn + Sexy + Hentai combinés

      if (pornScore > PORN_THRESHOLD) {
        isSafe = false;
        warnings.push('porn_detected');
        this.logger.warn(`⚠️  Porn detected: ${(pornScore * 100).toFixed(1)}%`);
      }

      if (sexyScore > SEXY_THRESHOLD) {
        isSafe = false;
        warnings.push('sexy_content_detected');
        this.logger.warn(`⚠️  Sexy content detected: ${(sexyScore * 100).toFixed(1)}%`);
      }

      if (hentaiScore > HENTAI_THRESHOLD) {
        isSafe = false;
        warnings.push('hentai_detected');
        this.logger.warn(`⚠️  Hentai detected: ${(hentaiScore * 100).toFixed(1)}%`);
      }

      // Vérification combinée pour les cas limites
      const combinedScore = pornScore + sexyScore + hentaiScore;
      if (combinedScore > COMBINED_THRESHOLD && isSafe) {
        isSafe = false;
        warnings.push('suspicious_content');
        this.logger.warn(`⚠️  Suspicious content (combined: ${(combinedScore * 100).toFixed(1)}%)`);
      }

      if (isSafe) {
        this.logger.log(`✅ Image passed moderation (neutral: ${(neutralScore * 100).toFixed(1)}%, porn: ${(pornScore * 100).toFixed(1)}%, sexy: ${(sexyScore * 100).toFixed(1)}%)`);
      }

      return {
        isSafe,
        pornScore,
        sexyScore,
        hentaiScore,
        neutralScore,
        warnings,
      };
    } catch (error) {
      this.logger.error(`❌ Moderation error: ${error.message}`);

      // En cas d'erreur, on considère l'image comme sûre pour ne pas bloquer
      // mais on log l'erreur pour investigation
      return {
        isSafe: true,
        warnings: ['moderation_error'],
      };
    }
  }

  /**
   * Vérifie si le service est activé
   */
  isEnabled(): boolean {
    return this.enabled && this.model !== null;
  }
}
