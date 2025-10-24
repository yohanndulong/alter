/**
 * Service de gestion de la caméra et capture de photos
 */

export interface CapturedPhoto {
  blob: Blob
  dataUrl: string
  isReel: boolean // true si prise avec la caméra, false si uploadée
}

class CameraService {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private facingMode: 'user' | 'environment' = 'user'
  private flashEnabled: boolean = false

  /**
   * Démarre la caméra et retourne un élément vidéo
   */
  async startCamera(facingMode: 'user' | 'environment' = 'user'): Promise<HTMLVideoElement> {
    try {
      this.facingMode = facingMode

      // Demander l'accès à la caméra avec les contraintes
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.facingMode,
          // Le flash sera géré via torch si supporté
        },
        audio: false,
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)

      // Créer un élément vidéo
      this.videoElement = document.createElement('video')
      this.videoElement.srcObject = this.stream
      this.videoElement.autoplay = true
      this.videoElement.playsInline = true

      console.log(`📷 Camera started (${this.facingMode})`)
      return this.videoElement
    } catch (error) {
      console.error('Failed to start camera:', error)
      throw new Error('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
    }
  }

  /**
   * Capture une photo depuis le flux vidéo
   */
  async capturePhoto(): Promise<CapturedPhoto> {
    if (!this.videoElement || !this.stream) {
      throw new Error('Camera not started')
    }

    return new Promise((resolve, reject) => {
      try {
        // Créer un canvas pour capturer l'image
        const canvas = document.createElement('canvas')
        canvas.width = this.videoElement!.videoWidth
        canvas.height = this.videoElement!.videoHeight

        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Dessiner l'image actuelle de la vidéo
        context.drawImage(this.videoElement!, 0, 0, canvas.width, canvas.height)

        // Convertir en blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'))
              return
            }

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

            console.log(`📷 Photo captured (${blob.size} bytes)`)

            resolve({
              blob,
              dataUrl,
              isReel: true, // Prise avec la caméra
            })
          },
          'image/jpeg',
          0.9
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Arrête la caméra
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
      this.videoElement = null
    }

    console.log('📷 Camera stopped')
  }

  /**
   * Change la caméra (avant/arrière)
   */
  async switchCamera(): Promise<HTMLVideoElement> {
    const newFacingMode = this.facingMode === 'user' ? 'environment' : 'user'
    const wasFlashEnabled = this.flashEnabled

    this.stopCamera()

    const videoElement = await this.startCamera(newFacingMode)

    // Réactiver le flash si il était activé
    if (wasFlashEnabled && this.supportsFlash()) {
      await this.toggleFlash(true)
    }

    console.log(`📷 Switched to ${newFacingMode} camera`)
    return videoElement
  }

  /**
   * Active/désactive le flash (torch)
   */
  async toggleFlash(enabled?: boolean): Promise<boolean> {
    if (!this.stream) {
      console.warn('Camera not started')
      return false
    }

    const videoTrack = this.stream.getVideoTracks()[0]

    if (!videoTrack) {
      console.warn('No video track available')
      return false
    }

    try {
      const capabilities = videoTrack.getCapabilities()

      // Vérifier si torch est supporté
      if (!('torch' in capabilities)) {
        console.warn('Flash not supported on this device')
        return false
      }

      // Toggle ou définir l'état
      this.flashEnabled = enabled !== undefined ? enabled : !this.flashEnabled

      await videoTrack.applyConstraints({
        // @ts-ignore - torch n'est pas dans les types TypeScript standard
        advanced: [{ torch: this.flashEnabled }]
      })

      console.log(`💡 Flash ${this.flashEnabled ? 'enabled' : 'disabled'}`)
      return this.flashEnabled
    } catch (error) {
      console.error('Failed to toggle flash:', error)
      return false
    }
  }

  /**
   * Vérifie si le flash est supporté
   */
  supportsFlash(): boolean {
    if (!this.stream) return false

    const videoTrack = this.stream.getVideoTracks()[0]
    if (!videoTrack) return false

    const capabilities = videoTrack.getCapabilities()
    return 'torch' in capabilities
  }

  /**
   * Obtient l'état actuel de la caméra
   */
  getCameraState(): {
    facingMode: 'user' | 'environment'
    flashEnabled: boolean
    flashSupported: boolean
  } {
    return {
      facingMode: this.facingMode,
      flashEnabled: this.flashEnabled,
      flashSupported: this.supportsFlash(),
    }
  }

  /**
   * Traite un fichier uploadé
   */
  async processUploadedFile(file: File): Promise<CapturedPhoto> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string

        resolve({
          blob: file,
          dataUrl,
          isReel: false, // Uploadée, pas prise avec l'app
        })
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsDataURL(file)
    })
  }

  /**
   * Vérifie si le navigateur supporte la caméra
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  }
}

export const cameraService = new CameraService()
