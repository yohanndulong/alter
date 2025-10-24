/**
 * Service de gestion de l'enregistrement vocal
 */

class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null
  private startTime: number = 0

  /**
   * Démarre l'enregistrement audio
   */
  async startRecording(): Promise<void> {
    try {
      // Demander la permission d'accéder au microphone
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Créer le MediaRecorder
      const options = { mimeType: 'audio/webm' }
      this.mediaRecorder = new MediaRecorder(this.stream, options)

      this.audioChunks = []
      this.startTime = Date.now()

      // Écouter les données audio
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      // Démarrer l'enregistrement
      this.mediaRecorder.start()

      console.log('🎤 Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw new Error('Impossible d\'accéder au microphone. Vérifiez les permissions.')
    }
  }

  /**
   * Arrête l'enregistrement et retourne le fichier audio
   */
  async stopRecording(): Promise<{ blob: Blob; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' })
        const duration = Math.floor((Date.now() - this.startTime) / 1000)

        // Arrêter le stream
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop())
          this.stream = null
        }

        console.log(`🎤 Recording stopped (${duration}s, ${blob.size} bytes)`)

        resolve({ blob, duration })
      }

      this.mediaRecorder.stop()
    })
  }

  /**
   * Annule l'enregistrement en cours
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    this.audioChunks = []
    console.log('🎤 Recording cancelled')
  }

  /**
   * Vérifie si un enregistrement est en cours
   */
  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording'
  }

  /**
   * Obtient la durée actuelle de l'enregistrement (en secondes)
   */
  getCurrentDuration(): number {
    if (!this.startTime) return 0
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  /**
   * Vérifie si le navigateur supporte l'enregistrement audio
   */
  static isSupported(): boolean {
    // @ts-expect-error - TypeScript thinks this is always true but we need runtime check for older browsers
    return !!(navigator.mediaDevices?.getUserMedia && 'MediaRecorder' in window)
  }
}

export const voiceRecorder = new VoiceRecorder()
