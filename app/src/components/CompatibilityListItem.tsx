import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User } from '@/types'
import { getProfileImageUrl } from '@/utils/image'
import { ConfirmDialog } from './ConfirmDialog'
import { Logo } from './Logo'
import { CachedImage } from './CachedImage'
import './CompatibilityListItem.css'

interface CompatibilityListItemProps {
  user: User
  onLike: () => void
  onPass?: () => void
  onDirectMessage?: () => void
  onGift?: () => void
  onClick: () => void
  hasProfileEmbedding?: boolean
}

export const CompatibilityListItem: React.FC<CompatibilityListItemProps> = ({
  user,
  onLike,
  onDirectMessage,
  onGift,
  onClick,
  hasProfileEmbedding = true,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [alreadyLikedModalOpen, setAlreadyLikedModalOpen] = useState(false)

  // Générer de faux pourcentages cohérents basés sur le nom
  const generateFakeScore = (seed: string, min: number = 60, max: number = 95): number => {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i)
      hash = hash & hash
    }
    return min + (Math.abs(hash) % (max - min + 1))
  }

  const fakeGlobal = generateFakeScore(user.name, 65, 92)
  const fakeLove = generateFakeScore(user.name + 'love', 60, 95)
  const fakeFriendship = generateFakeScore(user.name + 'friend', 60, 95)
  const fakeCarnal = generateFakeScore(user.name + 'carnal', 60, 95)

  const getBadgeInfo = (score: number) => {
    if (score >= 90) return { label: t('discover.topMatch'), className: 'top-match', icon: '⭐' }
    if (score >= 75) return { label: t('discover.strongAffinity'), className: 'strong-affinity', icon: '✨' }
    if (score >= 60) return { label: t('discover.goodMatch'), className: 'good-match', icon: '💫' }
    return null
  }

  const getTrendIcon = () => {
    if (!user.compatibilityEvolution) return null
    const { trend } = user.compatibilityEvolution
    if (trend === 'up') return '⬆️'
    if (trend === 'down') return '⬇️'
    return '➡️'
  }

  const getTrendText = () => {
    if (!user.compatibilityEvolution) return null
    const { weeklyChange, trend } = user.compatibilityEvolution

    if (trend === 'stable') return t('discover.stable')

    const changeAbs = Math.abs(weeklyChange)
    if (trend === 'up') {
      return t('discover.weeklyIncrease', { change: changeAbs })
    }
    return t('discover.weeklyDecrease', { change: changeAbs })
  }

  const displayScore = hasProfileEmbedding ? user.compatibilityScoreGlobal : fakeGlobal
  const badge = displayScore ? getBadgeInfo(displayScore) : null
  const trendIcon = getTrendIcon()
  const trendText = getTrendText()

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!hasProfileEmbedding) {
      setConfirmDialogOpen(true)
    } else if (user.isLiked) {
      setAlreadyLikedModalOpen(true)
    } else {
      onLike()
    }
  }

  const handleConfirmNavigate = () => {
    navigate('/alter-chat')
  }

  const handleDirectMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDirectMessage?.()
  }

  const handleGiftClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onGift?.()
  }

  return (
    <div className="compatibility-list-item" onClick={onClick}>
      <div className="compatibility-list-item-image">
        <CachedImage src={getProfileImageUrl(user) || ''} alt={user.name} />
        {badge && (
          <div className={`compatibility-badge ${badge.className}`}>
            <span className="badge-icon">{badge.icon}</span>
            <span className={`badge-label ${!hasProfileEmbedding ? 'blurred' : ''}`}>{badge.label}</span>
          </div>
        )}
      </div>

      <div className="compatibility-list-item-content">
        <div className="compatibility-list-item-header">
          <div className="compatibility-header-left">
            <h3 className="compatibility-list-item-name">
              {user.name}, {user.age}
            </h3>
            {trendText && (
              <div className="compatibility-evolution-badge">
                <span className="evolution-icon">{trendIcon}</span>
                <span className="evolution-text">{trendText}</span>
              </div>
            )}
          </div>
          <div className="compatibility-score-container">
            <div className="compatibility-score-main">
              <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                {hasProfileEmbedding ? `${user.compatibilityScoreGlobal}%` : `${fakeGlobal}%`}
              </span>
            </div>
          </div>
        </div>

        <div className="compatibility-scores-breakdown">
          {(hasProfileEmbedding ? user.compatibilityScoreLove !== undefined : true) && (
            <div className="score-pill love">
              💕 <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                {hasProfileEmbedding ? `${user.compatibilityScoreLove}%` : `${fakeLove}%`}
              </span>
            </div>
          )}
          {(hasProfileEmbedding ? user.compatibilityScoreFriendship !== undefined : true) && (
            <div className="score-pill friendship">
              🤝 <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                {hasProfileEmbedding ? `${user.compatibilityScoreFriendship}%` : `${fakeFriendship}%`}
              </span>
            </div>
          )}
          {(hasProfileEmbedding ? user.compatibilityScoreCarnal !== undefined : true) && (
            <div className="score-pill carnal">
              🔥 <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                {hasProfileEmbedding ? `${user.compatibilityScoreCarnal}%` : `${fakeCarnal}%`}
              </span>
            </div>
          )}
        </div>

        {(user.compatibilityInsight || !hasProfileEmbedding) && (
          <div className="compatibility-insight">
            <div className="insight-label">
              <Logo variant="icon" size={16} />
              {t('discover.alterSays')}
            </div>
            <div className="insight-text">
              {hasProfileEmbedding
                ? user.compatibilityInsight
                : t('discover.noEmbeddingInsight')}
            </div>
          </div>
        )}

        <div className="compatibility-list-item-actions">
          {hasProfileEmbedding && (
            <>
              <button
                className="list-action-button direct-message-button"
                onClick={handleDirectMessageClick}
                aria-label={t('discover.directMessage')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
                </svg>
              </button>
              <button
                className="list-action-button gift-button"
                onClick={handleGiftClick}
                aria-label={t('discover.sendGift')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 12v10H4V12M2 7h20v5H2V7z" fill="currentColor"/>
                  <path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}
          <button
            className={`list-action-button like-button ${user.isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
            aria-label={t('discover.interested')}
            title={user.isLiked ? t('discover.alreadyLiked') : undefined}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/>
            </svg>
          </button>
        </div>
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

      <ConfirmDialog
        isOpen={alreadyLikedModalOpen}
        onClose={() => setAlreadyLikedModalOpen(false)}
        message={t('discover.alreadyLikedMessage', { name: user.name })}
        icon="💕"
        customActions={
          <div className="already-liked-modal-actions">
            <button
              className="list-action-button gift-button"
              onClick={(e) => {
                e.stopPropagation()
                setAlreadyLikedModalOpen(false)
                onGift?.()
              }}
              aria-label={t('discover.sendGift')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 12v10H4V12M2 7h20v5H2V7z" fill="currentColor"/>
                <path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              className="list-action-button direct-message-button"
              onClick={(e) => {
                e.stopPropagation()
                setAlreadyLikedModalOpen(false)
                onDirectMessage?.()
              }}
              aria-label={t('discover.directMessage')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        }
      />
    </div>
  )
}
