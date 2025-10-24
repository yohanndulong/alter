import React, { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { voiceRecorder } from '@/services/voice'
import './VoiceRecorder.css'

export interface VoiceRecorderProps {
  isOpen: boolean
  onClose: () => void
  onSend: (blob: Blob, duration: number) => Promise<void>
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ isOpen, onClose, onSend }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRecording) {
      interval = setInterval(() => {
        setDuration(voiceRecorder.getCurrentDuration())
      }, 100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording])

  const handleStartRecording = async () => {
    try {
      await voiceRecorder.startRecording()
      setIsRecording(true)
      setDuration(0)
      setAudioBlob(null)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('Impossible d\'accéder au microphone')
    }
  }

  const handleStopRecording = async () => {
    try {
      const { blob, duration: recordedDuration } = await voiceRecorder.stopRecording()
      setIsRecording(false)
      setAudioBlob(blob)
      setDuration(recordedDuration)
    } catch (error) {
      console.error('Failed to stop recording:', error)
    }
  }

  const handleSend = async () => {
    if (!audioBlob) return

    setIsSending(true)
    try {
      await onSend(audioBlob, duration)
      handleClose()
    } catch (error) {
      console.error('Failed to send voice message:', error)
      alert('Erreur lors de l\'envoi du message vocal')
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    if (isRecording) {
      voiceRecorder.cancelRecording()
      setIsRecording(false)
    }
    setAudioBlob(null)
    setDuration(0)
    onClose()
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="voice-recorder">
        <h2 className="voice-recorder-title">Message vocal</h2>

        <div className="voice-recorder-display">
          {isRecording ? (
            <div className="voice-recorder-recording">
              <div className="voice-recorder-pulse" />
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ) : audioBlob ? (
            <div className="voice-recorder-ready">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ) : (
            <div className="voice-recorder-idle">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          <div className="voice-recorder-duration">{formatDuration(duration)}</div>

          {isRecording && (
            <div className="voice-recorder-hint">Enregistrement en cours...</div>
          )}
          {audioBlob && (
            <div className="voice-recorder-hint">Prêt à envoyer</div>
          )}
        </div>

        <div className="voice-recorder-actions">
          {!audioBlob && !isRecording && (
            <button
              className="voice-recorder-button voice-recorder-button--record"
              onClick={handleStartRecording}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="currentColor"/>
              </svg>
              Démarrer
            </button>
          )}

          {isRecording && (
            <button
              className="voice-recorder-button voice-recorder-button--stop"
              onClick={handleStopRecording}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
              </svg>
              Arrêter
            </button>
          )}

          {audioBlob && (
            <>
              <button
                className="voice-recorder-button voice-recorder-button--retry"
                onClick={handleStartRecording}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Recommencer
              </button>
              <button
                className="voice-recorder-button voice-recorder-button--send"
                onClick={handleSend}
                disabled={isSending}
              >
                {isSending ? (
                  'Envoi...'
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Envoyer
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
