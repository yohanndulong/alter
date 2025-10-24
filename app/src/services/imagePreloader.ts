/**
 * Service de cache des images par ID
 * Cache les images sans les paramètres de signature pour réutilisation
 */

class ImageCache {
  private cache: Map<string, string> = new Map() // ID -> data URL
  private loading: Map<string, Promise<string>> = new Map()
  private maxCacheSize = 100 // Maximum d'images en cache

  /**
   * Extrait l'ID de l'image depuis l'URL
   * Exemple: photos/b723907b-3172-4e99-8b06-2e8b9f2fba3f?token=... -> b723907b-3172-4e99-8b06-2e8b9f2fba3f
   */
  private extractImageId(url: string): string {
    try {
      // Extraire la partie avant les query params
      const urlWithoutParams = url.split('?')[0]
      // Extraire le dernier segment (l'ID)
      const parts = urlWithoutParams.split('/')
      return parts[parts.length - 1]
    } catch {
      return url
    }
  }

  /**
   * Charge une image et la met en cache
   * @param url - URL complète avec signature
   * @returns Data URL de l'image
   */
  async loadImage(url: string): Promise<string> {
    const imageId = this.extractImageId(url)

    // Si l'image est déjà en cache, la retourner
    if (this.cache.has(imageId)) {
      console.log(`📦 Image ${imageId} loaded from cache`)
      return this.cache.get(imageId)!
    }

    // Si l'image est en cours de chargement, attendre
    if (this.loading.has(imageId)) {
      console.log(`⏳ Image ${imageId} already loading, waiting...`)
      return this.loading.get(imageId)!
    }

    console.log(`🔄 Loading image ${imageId} from URL`)

    // Charger l'image
    const loadPromise = new Promise<string>((resolve, reject) => {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.blob()
        })
        .then(blob => {
          // Convertir en data URL pour le cache
          const reader = new FileReader()
          reader.onloadend = () => {
            const dataUrl = reader.result as string
            this.loading.delete(imageId)
            this.addToCache(imageId, dataUrl)
            console.log(`✅ Image ${imageId} cached successfully`)
            resolve(dataUrl)
          }
          reader.onerror = () => {
            this.loading.delete(imageId)
            reject(new Error(`Failed to convert image ${imageId} to data URL`))
          }
          reader.readAsDataURL(blob)
        })
        .catch(error => {
          this.loading.delete(imageId)
          console.error(`❌ Failed to load image ${imageId}:`, error)
          reject(error)
        })
    })

    this.loading.set(imageId, loadPromise)
    return loadPromise
  }

  /**
   * Ajoute une image au cache avec gestion de la taille
   */
  private addToCache(imageId: string, dataUrl: string): void {
    // Si le cache est plein, supprimer les plus anciennes entrées (FIFO)
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
        console.log(`🗑️ Removed ${firstKey} from cache (cache full)`)
      }
    }

    this.cache.set(imageId, dataUrl)
  }

  /**
   * Vérifie si une image est en cache
   */
  isCached(url: string): boolean {
    const imageId = this.extractImageId(url)
    return this.cache.has(imageId)
  }

  /**
   * Obtient une image du cache
   */
  getFromCache(url: string): string | null {
    const imageId = this.extractImageId(url)
    return this.cache.get(imageId) || null
  }

  /**
   * Supprime une image spécifique du cache
   */
  removeFromCache(url: string): void {
    const imageId = this.extractImageId(url)
    if (this.cache.has(imageId)) {
      this.cache.delete(imageId)
      console.log(`🗑️ Image ${imageId} removed from cache`)
    }
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cache.clear()
    this.loading.clear()
    console.log('🗑️ Image cache cleared')
  }

  /**
   * Obtient la taille actuelle du cache
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

export const imageCache = new ImageCache()
