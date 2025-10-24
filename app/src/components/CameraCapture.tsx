import React, { useState, useEffect, useRef } from 'react'
import { Modal } from './Modal'
import { cameraService, CapturedPhoto } from '@/services/camera'
import { PhotoViewMode } from '@/types'
import './CameraCapture.css'

export interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onSend: (photo: CapturedPhoto, viewMode: PhotoViewMode, viewDuration?: number) => Promise<void>
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ isOpen, onClose, onSend }) => {
  const [cameraStarted, setCameraStarted] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null)
  const [viewMode, setViewMode] = useState<PhotoViewMode>('unlimited')
  const [viewDuration, setViewDuration] = useState(10)
  const [isSending, setIsSending] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [flashSupported, setFlashSupported] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [videoKey, setVideoKey] = useState(0) // Force re-render du container vidéo
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && !cameraStarted) {
      startCamera()
    }

    return () => {
      if (cameraStarted) {
        cameraService.stopCamera()
        setCameraStarted(false)
      }
    }
  }, [isOpen])

  // Effet pour démarrer la caméra avec le videoRef
  useEffect(() => {
    if (cameraStarted && videoRef.current && !videoRef.current.srcObject) {
      startCameraStream()
    }
  }, [cameraStarted, videoKey])

  const startCameraStream = async () => {
    if (!videoRef.current) return

    try {
      await cameraService.stopCamera()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      // Vérifier si le flash est supporté
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities()
        setFlashSupported('torch' in capabilities)
      }
    } catch (error) {
      console.error('Failed to start camera stream:', error)
      alert('Impossible d\'accéder à la caméra')
      setCameraStarted(false)
    }
  }

  const startCamera = () => {
    setCameraStarted(true)
  }

  const handleSwitchCamera = async () => {
    try {
      const newFacingMode = facingMode === 'user' ? 'environment' : 'user'
      setFacingMode(newFacingMode)

      // Arrêter la caméra actuelle
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }

      // Forcer le re-render
      setVideoKey(prev => prev + 1)

      // Désactiver le flash car il peut ne pas être supporté sur l'autre caméra
      setFlashEnabled(false)
    } catch (error) {
      console.error('Failed to switch camera:', error)
      alert('Impossible de changer de caméra')
    }
  }

  const handleToggleFlash = async () => {
    try {
      if (!videoRef.current?.srcObject) return

      const stream = videoRef.current.srcObject as MediaStream
      const videoTrack = stream.getVideoTracks()[0]

      if (!videoTrack) return

      const capabilities = videoTrack.getCapabilities()
      if (!('torch' in capabilities)) {
        console.warn('Flash not supported')
        return
      }

      const newFlashEnabled = !flashEnabled

      await videoTrack.applyConstraints({
        // @ts-ignore - torch n'est pas dans les types TypeScript standard
        advanced: [{ torch: newFlashEnabled }]
      })

      setFlashEnabled(newFlashEnabled)
    } catch (error) {
      console.error('Failed to toggle flash:', error)
    }
  }

  const handleCapture = async () => {
    try {
      if (!videoRef.current) {
        throw new Error('Video element not ready')
      }

      // Créer un canvas pour capturer l'image
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight

      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to get canvas context')
      }

      // Dessiner l'image actuelle de la vidéo
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

      // Convertir en blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (!b) {
              reject(new Error('Failed to create blob'))
              return
            }
            resolve(b)
          },
          'image/jpeg',
          0.9
        )
      })

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

      setCapturedPhoto({
        blob,
        dataUrl,
        isReel: true, // Prise avec la caméra
      })

      // Arrêter la caméra
      if (videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
      setCameraStarted(false)
    } catch (error) {
      console.error('Failed to capture photo:', error)
      alert('Erreur lors de la capture')
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const photo = await cameraService.processUploadedFile(file)
      setCapturedPhoto(photo)
      cameraService.stopCamera()
      setCameraStarted(false)
    } catch (error) {
      console.error('Failed to process uploaded file:', error)
      alert('Erreur lors du traitement de la photo')
    }
  }

  const handleRetry = () => {
    setCapturedPhoto(null)
    setVideoKey(prev => prev + 1)
    startCamera()
  }

  const handleSend = async () => {
    if (!capturedPhoto) return

    setIsSending(true)
    try {
      await onSend(
        capturedPhoto,
        viewMode,
        viewMode === 'once' ? viewDuration : undefined
      )
      handleClose()
    } catch (error) {
      console.error('Failed to send photo:', error)
      alert('Erreur lors de l\'envoi de la photo')
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    // Arrêter le stream si actif
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraStarted(false)
    setCapturedPhoto(null)
    setFlashEnabled(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="camera-capture">
        <h2 className="camera-capture-title">Envoyer une photo</h2>

        <div className="camera-capture-preview">
          {capturedPhoto ? (
            <img src={capturedPhoto.dataUrl} alt="Captured" className="camera-capture-image" />
          ) : (
            <>
              <div className="camera-capture-video">
                {cameraStarted && (
                  <>
                    <div className="camera-capture-controls">
                      <button
                        className="camera-capture-control-button"
                        onClick={handleSwitchCamera}
                        title={facingMode === 'user' ? 'Passer à la caméra arrière' : 'Passer à la caméra avant'}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7 16l-4-4m0 0l4-4m-4 4h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {flashSupported && (
                        <button
                          className={`camera-capture-control-button ${flashEnabled ? 'camera-capture-control-button--active' : ''}`}
                          onClick={handleToggleFlash}
                          title={flashEnabled ? 'Désactiver le flash' : 'Activer le flash'}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {flashEnabled ? (
                              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            ) : (
                              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            )}
                          </svg>
                        </button>
                      )}
                    </div>
                    <video
                      key={videoKey}
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </>
                )}
                {!cameraStarted && (
                  <div className="camera-capture-placeholder">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>Démarrage de la caméra...</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {capturedPhoto && (
          <div className="camera-capture-options">
            <div className="camera-capture-option">
              <label className="camera-capture-label">Mode d'affichage</label>
              <div className="camera-capture-mode-buttons">
                <button
                  className={`camera-capture-mode-button ${viewMode === 'unlimited' ? 'camera-capture-mode-button--active' : ''}`}
                  onClick={() => setViewMode('unlimited')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Illimité
                </button>
                <button
                  className={`camera-capture-mode-button ${viewMode === 'once' ? 'camera-capture-mode-button--active' : ''}`}
                  onClick={() => setViewMode('once')}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Vue unique
                </button>
              </div>
            </div>

            {viewMode === 'once' && (
              <div className="camera-capture-option">
                <label className="camera-capture-label">
                  Durée d'affichage: {viewDuration}s
                </label>
                <input
                  type="range"
                  min="3"
                  max="30"
                  value={viewDuration}
                  onChange={(e) => setViewDuration(parseInt(e.target.value))}
                  className="camera-capture-slider"
                />
              </div>
            )}

            {capturedPhoto.isReel && (
              <div className="camera-capture-reel-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
                Cette photo sera marquée comme "REEL" (prise avec l'app)
              </div>
            )}
          </div>
        )}

        <div className="camera-capture-actions">
          {!capturedPhoto && cameraStarted && (
            <>
              <button
                className="camera-capture-button camera-capture-button--secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Choisir
              </button>
              <button
                className="camera-capture-button camera-capture-button--capture"
                onClick={handleCapture}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="6" fill="currentColor"/>
                </svg>
              </button>
            </>
          )}

          {capturedPhoto && (
            <>
              <button
                className="camera-capture-button camera-capture-button--secondary"
                onClick={handleRetry}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reprendre
              </button>
              <button
                className="camera-capture-button camera-capture-button--send"
                onClick={handleSend}
                disabled={isSending}
              >
                {isSending ? (
                  'Envoi...'
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
      </div>
    </Modal>
  )
}
