import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
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

      // Vérifier si l'API Web Share est disponible
      if (navigator.share) {
        await navigator.share({
          title: 'Mon profil Alter',
          text: fullMessage,
          // On pourrait ajouter une URL vers le profil public si disponible
          // url: 'https://alterdating.com/profile/...'
        })
      } else {
        // Fallback : copier dans le presse-papiers
        await navigator.clipboard.writeText(fullMessage)
        alert(t('share.copiedToClipboard') || 'Message copié dans le presse-papiers !')
      }

      // Fermer la modal après le partage
      setShowPreview(false)
    } catch (err: any) {
      // L'utilisateur a annulé le partage
      if (err.name === 'AbortError') {
        return
      }

      console.error('Error sharing profile:', err)
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
      <div className="share-button">
        <Button
          variant={variant}
          size={size}
          onClick={handleGenerate}
          loading={isGenerating}
          leftIcon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08259 9.14496C7.54305 8.4556 6.72376 8 5.8 8C4.14315 8 3 9.34315 3 11C3 12.6569 4.14315 14 5.8 14C6.72376 14 7.54305 13.5444 8.08259 12.855L15.0227 16.6294C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.0762 14 16.257 14.4556 15.7174 15.145L8.77735 11.3706C8.79229 11.2492 8.8 11.1255 8.8 11C8.8 10.8745 8.79229 10.7508 8.77735 10.6294L15.7174 6.85496C16.257 7.5444 17.0762 8 18 8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        >
          {t('share.button')}
        </Button>
        {error && <div className="share-button__error">{error}</div>}
      </div>

      {/* Modal de prévisualisation */}
      {showPreview && generatedMessage && (
        <div className="share-preview-overlay" onClick={() => setShowPreview(false)}>
          <div className="share-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-preview-header">
              <h3 className="share-preview-title">{t('share.previewTitle')}</h3>
              <button
                className="share-preview-close"
                onClick={() => setShowPreview(false)}
              >
                ×
              </button>
            </div>

            <div className="share-preview-content">
              <div className="share-preview-message">
                {generatedMessage}
              </div>
              <div className="share-preview-hashtags">
                #Alter #Dating #NewBeginnings
              </div>
            </div>

            <div className="share-preview-actions">
              <Button
                variant="outline"
                size="md"
                onClick={handleCopyToClipboard}
                leftIcon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V18M8 5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5M8 5C8 6.10457 8.89543 7 10 7H14C15.1046 7 16 6.10457 16 5M16 5H18C19.1046 5 20 5.89543 20 7V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.24917 15.0227 5.37061L8.08259 9.14496C7.54305 8.4556 6.72376 8 5.8 8C4.14315 8 3 9.34315 3 11C3 12.6569 4.14315 14 5.8 14C6.72376 14 7.54305 13.5444 8.08259 12.855L15.0227 16.6294C15.0077 16.7508 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C17.0762 14 16.257 14.4556 15.7174 15.145L8.77735 11.3706C8.79229 11.2492 8.8 11.1255 8.8 11C8.8 10.8745 8.79229 10.7508 8.77735 10.6294L15.7174 6.85496C16.257 7.5444 17.0762 8 18 8Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
