import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageMedia } from '@/types'
import { chatService } from '@/services/chat'
import { moderationService, ModerationResult } from '@/services/moderation'
import { CachedImage } from './CachedImage'
import { imageCache } from '@/services/imagePreloader'
import './PhotoMessage.css'

export interface PhotoMessageProps {
  media: MessageMedia
  isSent: boolean
  matchId: string
  isReceiver: boolean
}

export const PhotoMessage: React.FC<PhotoMessageProps> = ({ media, isSent, matchId, isReceiver }) => {
  const { t } = useTranslation()
  // Pour les photos "once" envoyées, ne pas les révéler automatiquement
  const [isRevealed, setIsRevealed] = useState(
    (isSent && media.viewMode !== 'once') ||
    media.viewMode === 'unlimited' ||
    media.viewed ||
    false
  )
  const [countdown, setCountdown] = useState(media.viewDuration || 0)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [localViewed, setLocalViewed] = useState(false)
  const [clientModerationResult, setClientModerationResult] = useState<ModerationResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasAnalyzed = useRef(false)

  // Utiliser directement media.receiverStatus au lieu d'un état local
  // Cela permet aux mises à jour WebSocket de fonctionner correctement

  // Vérifier si la photo nécessite l'accord du destinataire
  // Utiliser le résultat de modération CLIENT (pas serveur)
  // Ne pas afficher la modale si la photo a déjà été vue
  const needsApproval =
    isReceiver &&
    media.receiverStatus === 'pending' &&
    clientModerationResult &&
    !clientModerationResult.isSafe &&
    !media.viewed &&
    !localViewed

  // Photo rejetée
  const isRejected = media.receiverStatus === 'rejected'

  // Analyser l'image côté client quand elle arrive (uniquement pour le destinataire)
  useEffect(() => {
    // Ne pas analyser si :
    // - On a déjà analysé
    // - C'est notre propre photo
    // - Pas d'URL
    // - Photo déjà vue
    // - En cours d'analyse
    if (hasAnalyzed.current || isSent || !media.url || media.viewed || isAnalyzing) {
      return
    }

    // Si le destinataire reçoit une photo, l'analyser
    if (isReceiver && media.processingStatus === 'completed') {
      hasAnalyzed.current = true
      setIsAnalyzing(true)

      console.log('🔍 Starting client-side NSFW analysis for received photo')

      moderationService
        .analyzeImage(media.url)
        .then(async result => {
          console.log('📊 Client-side moderation result:', result)
          setClientModerationResult(result)

          // Si safe, accepter automatiquement via l'API
          // Le WebSocket mettra à jour le cache automatiquement
          if (result.isSafe) {
            try {
              await chatService.acceptMedia(matchId, media.id)
              console.log('✅ Auto-accepted safe photo')
            } catch (error) {
              console.error('Failed to auto-accept media:', error)
            }
          }
          // Si NSFW, ne rien faire - la modale s'affichera
        })
        .catch(async error => {
          console.error('❌ Client-side moderation failed:', error)
          // En cas d'erreur, accepter par défaut
          setClientModerationResult({
            isSafe: true,
            warnings: ['analysis_failed'],
          })
          try {
            await chatService.acceptMedia(matchId, media.id)
          } catch (err) {
            console.error('Failed to auto-accept media after error:', err)
          }
        })
        .finally(() => {
          setIsAnalyzing(false)
        })
    }
  }, [media.url, media.processingStatus, isReceiver, isSent, media.viewed, isAnalyzing])

  useEffect(() => {
    // Si c'est une photo "once" et qu'elle a été vue côté serveur (pas juste localement), la masquer
    // Ne pas masquer si localViewed vient d'être set (on est en train de voir la photo)
    if (media.viewMode === 'once' && media.viewed && isReceiver && !localViewed) {
      setIsRevealed(false)
    }
  }, [media.viewMode, media.viewed, isReceiver, localViewed])

  const handleReveal = async () => {
    if (isRevealed || isSent) return

    // Empêcher de revoir une photo "once" déjà vue
    if (media.viewMode === 'once' && (media.viewed || localViewed)) return

    setIsRevealed(true)

    // Si mode "once", démarrer le compte à rebours
    if (media.viewMode === 'once' && media.viewDuration) {
      setCountdown(media.viewDuration)

      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // Masquer la photo
            setIsRevealed(false)
            // Marquer comme vue APRÈS le countdown
            setLocalViewed(true)

            // Appeler l'API pour marquer comme vue (supprime le fichier côté serveur)
            if (isReceiver && !media.viewed) {
              chatService.markPhotoAsViewed(matchId, media.id).catch(error => {
                console.error('Failed to mark photo as viewed:', error)
              })
            }

            // Supprimer du cache côté client
            if (media.url) {
              imageCache.removeFromCache(media.url)
            }

            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      // Photo unlimited - marquer comme vue immédiatement
      if (isReceiver && !media.viewed) {
        try {
          await chatService.markPhotoAsViewed(matchId, media.id)
        } catch (error) {
          console.error('Failed to mark photo as viewed:', error)
        }
      }
    }
  }

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullscreen) {
        setShowFullscreen(false)
      }
    }

    if (showFullscreen) {
      document.addEventListener('keydown', handleEscape)
      // Empêcher le scroll du body quand la modale est ouverte
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [showFullscreen])

  const handleImageClick = () => {
    // Ne pas ouvrir en plein écran si c'est une photo "once" avec countdown actif
    if (media.viewMode === 'once' && countdown > 0) {
      return
    }
    setShowFullscreen(true)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    // Empêcher le clic droit sur les images
    e.preventDefault()
    return false
  }

  const handleAcceptMedia = async () => {
    setIsProcessing(true)
    try {
      await chatService.acceptMedia(matchId, media.id)
      // Le WebSocket mettra à jour le cache automatiquement
      // On révèle l'image immédiatement pour une meilleure UX
      setIsRevealed(true)

      // Si mode "once", démarrer le compte à rebours
      if (media.viewMode === 'once' && media.viewDuration) {
        setCountdown(media.viewDuration)

        countdownIntervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              // Masquer la photo
              setIsRevealed(false)
              // Marquer comme vue APRÈS le countdown
              setLocalViewed(true)

              // Appeler l'API pour marquer comme vue (supprime le fichier côté serveur)
              if (!media.viewed) {
                chatService.markPhotoAsViewed(matchId, media.id).catch(error => {
                  console.error('Failed to mark photo as viewed:', error)
                })
              }

              // Supprimer du cache côté client
              if (media.url) {
                imageCache.removeFromCache(media.url)
              }

              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current)
              }
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        // Photo unlimited - marquer comme vue immédiatement
        if (!media.viewed) {
          try {
            await chatService.markPhotoAsViewed(matchId, media.id)
          } catch (error) {
            console.error('Failed to mark photo as viewed:', error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to accept media:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectMedia = async () => {
    setIsProcessing(true)
    try {
      await chatService.rejectMedia(matchId, media.id)
      // Ne PAS mettre à jour le statut local ici
      // Le WebSocket va mettre à jour le cache React Query automatiquement
      // On laisse juste le composant se re-render avec les nouvelles données du cache
      console.log('✅ Media rejected, waiting for WebSocket update...')
    } catch (error) {
      console.error('Failed to reject media:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Vérifier si la photo est en cours de traitement (serveur ou client)
  const isProcessingNSFW = media.processingStatus === 'processing' || (isReceiver && isAnalyzing)

  return (
    <div className={`photo-message ${isSent ? 'photo-message--sent' : 'photo-message--received'}`}>
      {isProcessingNSFW ? (
        <div className="photo-message-processing">
          <div className="photo-message-processing-spinner"></div>
          <div className="photo-message-processing-text">
            {isAnalyzing ? t('chat.photoAnalyzing') : t('chat.photoProcessing')}
          </div>
        </div>
      ) : isRejected ? (
        <div className="photo-message-rejected">
          <div className="photo-message-rejected-icon">🚫</div>
          <div className="photo-message-rejected-text">
            {isSent ? t('chat.photoRejectedBySender') : t('chat.photoRejectedByReceiver')}
          </div>
        </div>
      ) : needsApproval ? (
        <div className="photo-message-sensitive">
          <div className="photo-message-sensitive-blur">
            <CachedImage
              src={media.url || ''}
              alt="Photo"
              className="photo-message-sensitive-image-blurred"
            />
          </div>
          <div className="photo-message-sensitive-overlay">
            <div className="photo-message-sensitive-badge">18+</div>
            <div className="photo-message-sensitive-title">{t('chat.sensitiveContentDetected')}</div>
            <div className="photo-message-sensitive-description">
              {t('chat.sensitiveContentWarning')}
            </div>
            <div className="photo-message-sensitive-actions">
              <button
                className="photo-message-sensitive-btn photo-message-sensitive-btn--accept"
                onClick={handleAcceptMedia}
                disabled={isProcessing}
              >
                {isProcessing ? t('common.loading') : t('chat.viewAnyway')}
              </button>
              <button
                className="photo-message-sensitive-btn photo-message-sensitive-btn--reject"
                onClick={handleRejectMedia}
                disabled={isProcessing}
              >
                {t('chat.reject')}
              </button>
            </div>
          </div>
        </div>
      ) : !isRevealed && !isSent && !(media.viewMode === 'once' && (media.viewed || localViewed)) ? (
        media.viewMode === 'once' ? (
          <div className="photo-message-once-waiting" onClick={handleReveal}>
            <div className="photo-message-once-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <text x="12" y="17" fontSize="14" fontWeight="bold" fill="currentColor" textAnchor="middle">1</text>
              </svg>
            </div>
            <div className="photo-message-once-label">
              {t('chat.photo')}
            </div>
          </div>
        ) : (
          <button className="photo-message-reveal" onClick={handleReveal}>
            <div className="photo-message-reveal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="photo-message-reveal-text">
              <div>Voir la photo</div>
            </div>
            {media.isReel && (
              <div className="photo-message-reel-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>
                REEL
              </div>
            )}
          </button>
        )
      ) : media.viewMode === 'once' && (media.viewed || localViewed) && !isSent ? (
        <div className="photo-message-expired">
          <div className="photo-message-expired-icon">👁️</div>
          <div className="photo-message-expired-text">
            {t('chat.photoExpired')}
          </div>
        </div>
      ) : media.viewMode === 'once' && isSent ? (
        <div className="photo-message-once-waiting">
          <div className="photo-message-once-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <text x="12" y="17" fontSize="14" fontWeight="bold" fill="currentColor" textAnchor="middle">1</text>
            </svg>
          </div>
          <div className="photo-message-once-label">
            {t('chat.photoSent')}
          </div>
        </div>
      ) : (
        <div className="photo-message-content">
          <CachedImage
            src={media.url || ''}
            alt="Photo"
            className={`photo-message-image ${media.viewMode !== 'once' || countdown === 0 ? 'photo-message-image--clickable' : ''}`}
            onClick={handleImageClick}
            onContextMenu={handleContextMenu}
            draggable={false}
          />

          {media.isReel && (
            <div className="photo-message-reel-badge photo-message-reel-badge--overlay">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              REEL
            </div>
          )}

          {media.viewMode === 'once' && countdown > 0 && isRevealed && !isSent && (
            <div className="photo-message-once-opened">
              <div className="photo-message-once-text">
                Ouvert {countdown}s
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modale plein écran */}
      {showFullscreen && (
        <div className="photo-message-fullscreen" onClick={() => setShowFullscreen(false)}>
          <button className="photo-message-fullscreen-close" onClick={() => setShowFullscreen(false)}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="photo-message-fullscreen-content" onClick={(e) => e.stopPropagation()}>
            <CachedImage
              src={media.url || ''}
              alt="Photo"
              className="photo-message-fullscreen-image"
              onContextMenu={handleContextMenu}
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
