import * as nsfwjs from 'nsfwjs'
import * as tf from '@tensorflow/tfjs'

export interface ModerationResult {
  isSafe: boolean
  pornScore?: number
  sexyScore?: number
  hentaiScore?: number
  neutralScore?: number
  drawingScore?: number
  warnings: string[]
}

class ModerationService {
  private model: nsfwjs.NSFWJS | null = null
  private loadPromise: Promise<void> | null = null

  /**
   * Charge le modèle NSFW.js (InceptionV3)
   * Utilise un singleton pour éviter de charger plusieurs fois
   */
  async loadModel(): Promise<void> {
    // Si déjà chargé, retourner immédiatement
    if (this.model) return

    // Si en cours de chargement, attendre la fin
    if (this.loadPromise) return this.loadPromise

    console.log('🤖 Loading NSFW.js model (InceptionV3)...')

    this.loadPromise = (async () => {
      try {
        // Initialiser TensorFlow.js
        await tf.ready()
        console.log('✅ TensorFlow.js ready')

        // Charger InceptionV3 (plus précis, ~23MB)
        this.model = await nsfwjs.load('InceptionV3')
        console.log('✅ NSFW.js model loaded successfully')
      } catch (error) {
        console.error('❌ Failed to load NSFW.js model:', error)
        throw error
      }
    })()

    return this.loadPromise
  }

  /**
   * Analyse une image pour détecter du contenu NSFW
   * @param imageUrl URL de l'image à analyser (peut être un blob URL)
   */
  async analyzeImage(imageUrl: string): Promise<ModerationResult> {
    // Charger le modèle si nécessaire
    if (!this.model) {
      await this.loadModel()
    }

    if (!this.model) {
      console.warn('⚠️ NSFW model not loaded, skipping analysis')
      return {
        isSafe: true,
        warnings: ['model_not_loaded'],
      }
    }

    try {
      console.log('🔍 Analyzing image for NSFW content...')

      // Créer un élément image
      const img = new Image()
      img.crossOrigin = 'anonymous'

      // Charger l'image
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imageUrl
      })

      // Analyser avec NSFW.js (top 5 predictions)
      const predictions = await this.model.classify(img, 5)

      // Extraire les scores
      const scores = predictions.reduce((acc, pred) => {
        acc[pred.className] = pred.probability
        return acc
      }, {} as Record<string, number>)

      const pornScore = scores.Porn || 0
      const sexyScore = scores.Sexy || 0
      const hentaiScore = scores.Hentai || 0
      const neutralScore = scores.Neutral || 0
      const drawingScore = scores.Drawing || 0

      const warnings: string[] = []
      let isSafe = true

      // Seuils de détection (ajustables)
      const PORN_THRESHOLD = 0.7 // 70%
      const SEXY_THRESHOLD = 0.8 // 80%
      const HENTAI_THRESHOLD = 0.7 // 70%
      const COMBINED_THRESHOLD = 0.5 // 50% combiné

      if (pornScore > PORN_THRESHOLD) {
        isSafe = false
        warnings.push('porn_detected')
        console.warn(`⚠️ Porn detected: ${(pornScore * 100).toFixed(1)}%`)
      }

      if (sexyScore > SEXY_THRESHOLD) {
        isSafe = false
        warnings.push('sexy_content_detected')
        console.warn(`⚠️ Sexy content detected: ${(sexyScore * 100).toFixed(1)}%`)
      }

      if (hentaiScore > HENTAI_THRESHOLD) {
        isSafe = false
        warnings.push('hentai_detected')
        console.warn(`⚠️ Hentai detected: ${(hentaiScore * 100).toFixed(1)}%`)
      }

      // Vérification combinée pour les cas limites
      const combinedScore = pornScore + sexyScore + hentaiScore
      if (combinedScore > COMBINED_THRESHOLD && isSafe) {
        isSafe = false
        warnings.push('suspicious_content')
        console.warn(`⚠️ Suspicious content (combined: ${(combinedScore * 100).toFixed(1)}%)`)
      }

      if (isSafe) {
        console.log(
          `✅ Image passed moderation (neutral: ${(neutralScore * 100).toFixed(1)}%, ` +
          `porn: ${(pornScore * 100).toFixed(1)}%, sexy: ${(sexyScore * 100).toFixed(1)}%)`
        )
      }

      return {
        isSafe,
        pornScore,
        sexyScore,
        hentaiScore,
        neutralScore,
        drawingScore,
        warnings,
      }
    } catch (error) {
      console.error('❌ NSFW analysis error:', error)
      // En cas d'erreur, considérer comme safe pour ne pas bloquer
      return {
        isSafe: true,
        warnings: ['analysis_error'],
      }
    }
  }

  /**
   * Précharge le modèle au démarrage de l'app
   */
  async preload(): Promise<void> {
    try {
      await this.loadModel()
    } catch (error) {
      console.error('Failed to preload NSFW model:', error)
    }
  }

  /**
   * Vérifie si le modèle est chargé
   */
  isModelLoaded(): boolean {
    return this.model !== null
  }
}

// Singleton
export const moderationService = new ModerationService()
