import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Modal, ProfileCard, ConfirmDialog, Logo } from '@/components'
import { User } from '@/types'
import './ProfileModal.css'

export interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  profile: User
  onLike?: () => void
  onPass?: () => void
  onDirectMessage?: () => void
  onGift?: () => void
  showActions?: boolean
  hasProfileEmbedding?: boolean
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onLike,
  onPass,
  onDirectMessage,
  onGift,
  showActions = true,
  hasProfileEmbedding = true,
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const handleLikeClick = () => {
    if (!hasProfileEmbedding) {
      setConfirmDialogOpen(true)
    } else if (onLike) {
      onLike()
    }
  }

  const handleConfirmNavigate = () => {
    navigate('/alter-chat')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnBackdropClick={true}
      enableSwipeToClose={false}
    >
      <div className="profile-modal">
        <div className="profile-modal-card">
          <ProfileCard
            name={profile.name}
            age={profile.age}
            bio={profile.bio}
            interests={profile.interests}
            images={profile.images}
            distance={profile.location ? 5 : undefined}
            compatibilityScoreGlobal={profile.compatibilityScoreGlobal}
            compatibilityScoreLove={profile.compatibilityScoreLove}
            compatibilityScoreFriendship={profile.compatibilityScoreFriendship}
            compatibilityScoreCarnal={profile.compatibilityScoreCarnal}
            disableSwipe={false}
            hasProfileEmbedding={hasProfileEmbedding}
          />
        </div>
        {showActions && (onLike || onPass || (hasProfileEmbedding && (onDirectMessage || onGift))) && (
          <div className="profile-modal-actions">
            {onDirectMessage && hasProfileEmbedding && (
              <button
                className="profile-modal-action-button direct-message-button"
                onClick={onDirectMessage}
                aria-label={t('common.directMessage')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
                </svg>
              </button>
            )}
            {onGift && hasProfileEmbedding && (
              <button
                className="profile-modal-action-button gift-button"
                onClick={onGift}
                aria-label={t('common.sendGift')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 12v10H4V12M2 7h20v5H2V7z" fill="currentColor"/>
                  <path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            {onLike && (
              <button
                className="profile-modal-action-button like-button"
                onClick={handleLikeClick}
                aria-label={t('common.like')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmNavigate}
        message={t('discover.noEmbeddingLikeConfirm')}
        confirmText={t('discover.chatWithAlter')}
        cancelText={t('discover.notNow')}
        icon={<Logo variant="icon" size={48} />}
      />
    </Modal>
  )
}
