import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from '@capacitor/share'
import { chatService } from '@/services/chat'
import { Button } from './Button'
import './ShareButton.css'

export interface ShareButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  variant = 'outline',
  size = 'md'
}) => {
  const { t } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleGenerate = async () => {
    setError(null)
    setIsGenerating(true)

    try {
      // Générer le message de partage via l'API
      const { message } = await chatService.generateShareMessage()
      setGeneratedMessage(message)
      setShowPreview(true)
    } catch (err: any) {
      console.error('Error generating share message:', err)
      setError(t('share.error') || 'Erreur lors de la génération du message')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    if (!generatedMessage) return

    try {
      const fullMessage = `${generatedMessage}\n\n#Alter #Dating #NewBeginnings`

      // Utiliser le plugin Capacitor Share pour un meilleur support natif
      const canShare = await Share.canShare()

      if (canShare.value) {
        await Share.share({
          title: 'Mon profil Alter',
          text: fullMessage,
          dialogTitle: 'Partager mon profil',
          // On pourrait ajouter une URL vers le profil public si disponible
          // url: 'https://alterdating.com/profile/...'
        })
        // Fermer la modal uniquement si le partage a réussi
        setShowPreview(false)
      } else {
        // Si le partage n'est pas disponible, afficher un message
        setError(t('share.notSupported') || 'Le partage natif n\'est pas supporté sur cet appareil. Utilisez le bouton "Copier" à la place.')
      }
    } catch (err: any) {
      console.error('Error sharing profile:', err)
      // Ne pas afficher d'erreur si l'utilisateur a simplement annulé
      // Le plugin Capacitor ne lève pas d'exception pour l'annulation
      setError(t('share.errorSharing') || 'Erreur lors du partage')
    }
  }

  const handleCopyToClipboard = async () => {
    if (!generatedMessage) return

    try {
      const fullMessage = `${generatedMessage}\n\n#Alter #Dating #NewBeginnings`
      await navigator.clipboard.writeText(fullMessage)
      alert(t('share.copiedToClipboard') || 'Message copié dans le presse-papiers !')
      setShowPreview(false)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      setError(t('share.errorCopy') || 'Erreur lors de la copie')
    }
  }

  return (
    <>
      <button
        className="share-button-icon"
        onClick={handleGenerate}
        disabled={isGenerating}
        title={t('share.button')}
      >
        {isGenerating ? (
          <svg className="share-button-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32 32" opacity="0.25"/>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="16 48" transform="rotate(-90 12 12)">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      {error && <div className="share-button__error">{error}</div>}

      {/* Modal de prévisualisation */}
      {showPreview && generatedMessage && (
        <div className="share-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="share-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="share-preview-close"
              onClick={() => setShowPreview(false)}
              aria-label={t('common.close')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="share-preview-header">
              <div className="share-preview-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="url(#shareGradient)"/>
                  <path d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="shareGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-primary-500)"/>
                      <stop offset="100%" stopColor="var(--color-secondary-500)"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <h3 className="share-preview-title">{t('share.previewTitle')}</h3>
                <p className="share-preview-subtitle">{t('share.previewSubtitle')}</p>
              </div>
            </div>

            <div className="share-preview-content">
              <div className="share-preview-message">
                <div className="share-preview-message-icon">✨</div>
                <div className="share-preview-message-text">{generatedMessage}</div>
              </div>
              <div className="share-preview-hashtags">
                <span className="share-preview-hashtag">#Alter</span>
                <span className="share-preview-hashtag">#Dating</span>
                <span className="share-preview-hashtag">#NewBeginnings</span>
              </div>
            </div>

            <div className="share-preview-actions">
              <Button
                variant="outline"
                size="md"
                onClick={handleCopyToClipboard}
                leftIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="8" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              >
                {t('share.copy')}
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleShare}
                leftIcon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98M21 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              >
                {t('share.shareNow')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
