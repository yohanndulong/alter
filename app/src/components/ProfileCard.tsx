import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getImageUrl } from '@/utils/image'
import { ConfirmDialog } from './ConfirmDialog'
import { Logo } from './Logo'
import { CachedImage } from './CachedImage'
import './ProfileCard.css'

export interface ProfileCardProps {
  name: string
  age: number
  bio?: string
  interests?: string[]
  images: string[]
  distance?: number
  compatibilityScore?: number
  compatibilityScoreGlobal?: number
  compatibilityScoreLove?: number
  compatibilityScoreFriendship?: number
  compatibilityScoreCarnal?: number
  onLike?: () => void
  onPass?: () => void
  onUndo?: () => void
  onDirectMessage?: () => void
  disableUndo?: boolean
  disableSwipe?: boolean
  hasProfileEmbedding?: boolean
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  age,
  bio,
  interests = [],
  images,
  distance,
  compatibilityScore,
  compatibilityScoreGlobal,
  compatibilityScoreLove,
  compatibilityScoreFriendship,
  compatibilityScoreCarnal,
  onLike,
  onPass,
  onUndo,
  onDirectMessage,
  disableUndo = false,
  disableSwipe = false,
  hasProfileEmbedding = true,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [contentPageIndex, setContentPageIndex] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 })
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false)
  const [confirmAction, setConfirmAction] = React.useState<'like' | 'pass' | null>(null)
  const cardRef = React.useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const hasMultiScores = hasProfileEmbedding ? compatibilityScoreGlobal !== undefined : true

  // Calculer le nombre de pages en fonction du contenu disponible
  const hasBio = bio && bio.length > 0
  const hasInterests = interests && interests.length > 0

  let totalContentPages = 1
  if (hasMultiScores) {
    // Avec scores multiples : 3 pages (bio+intérêts, bio complète, scores)
    totalContentPages = hasInterests ? 3 : 2
  } else if (hasBio && hasInterests) {
    // Sans scores mais avec bio et intérêts : 2 pages (bio+intérêts, bio complète)
    totalContentPages = 2
  } else {
    // Seulement bio ou seulement intérêts : 1 page
    totalContentPages = 1
  }

  // Générer de faux pourcentages cohérents basés sur le nom
  const generateFakeScore = (seed: string, min: number = 60, max: number = 95): number => {
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i)
      hash = hash & hash
    }
    return min + (Math.abs(hash) % (max - min + 1))
  }

  const fakeGlobal = generateFakeScore(name, 65, 92)
  const fakeLove = generateFakeScore(name + 'love', 60, 95)
  const fakeFriendship = generateFakeScore(name + 'friend', 60, 95)
  const fakeCarnal = generateFakeScore(name + 'carnal', 60, 95)

  const handleLikeClick = () => {
    if (!hasProfileEmbedding) {
      setConfirmAction('like')
      setConfirmDialogOpen(true)
    } else if (onLike) {
      onLike()
    }
  }

  const handlePassClick = () => {
    if (!hasProfileEmbedding) {
      setConfirmAction('pass')
      setConfirmDialogOpen(true)
    } else if (onPass) {
      onPass()
    }
  }

  const handleConfirmNavigate = () => {
    navigate('/alter-chat')
  }

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    // Chaque clic avance dans les images ET dans les pages de contenu en même temps
    const newImageIndex = (currentImageIndex + 1) % images.length
    const newContentPageIndex = (contentPageIndex + 1) % totalContentPages

    setCurrentImageIndex(newImageIndex)
    setContentPageIndex(newContentPageIndex)
  }

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    // Chaque clic recule dans les images ET dans les pages de contenu en même temps
    const newImageIndex = (currentImageIndex - 1 + images.length) % images.length
    const newContentPageIndex = (contentPageIndex - 1 + totalContentPages) % totalContentPages

    setCurrentImageIndex(newImageIndex)
    setContentPageIndex(newContentPageIndex)
  }

  const handleDragStart = (clientX: number, clientY: number) => {
    if (disableSwipe) return
    setIsDragging(true)
    setStartPos({ x: clientX, y: clientY })
  }

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || disableSwipe) return

    const deltaX = clientX - startPos.x
    const deltaY = clientY - startPos.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleDragEnd = () => {
    if (!isDragging || disableSwipe) return

    const threshold = 100

    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0 && onLike) {
        // Swipe right = Like
        onLike()
      } else if (dragOffset.x < 0 && onPass) {
        // Swipe left = Pass
        onPass()
      }
    }

    setIsDragging(false)
    setDragOffset({ x: 0, y: 0 })
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.stopPropagation()
    }
    handleDragMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleDragEnd()
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.stopPropagation()
    }
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    handleDragEnd()
  }

  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd()
      }
    }

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('mousemove', handleGlobalMouseUp as any)
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleGlobalMouseUp as any)
    }
  }, [isDragging])

  const rotation = dragOffset.x * 0.1
  const likeOpacity = Math.max(0, Math.min(1, dragOffset.x / 100))
  const passOpacity = Math.max(0, Math.min(1, -dragOffset.x / 100))

  const cardStyle: React.CSSProperties = {
    transform: isDragging && !disableSwipe
      ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`
      : 'translate(0, 0) rotate(0deg)',
    transition: isDragging ? 'none' : 'transform 0.3s ease',
    cursor: disableSwipe ? 'default' : (isDragging ? 'grabbing' : 'grab'),
  }

  return (
    <div
      className="profile-card card card--padding-none"
      style={cardStyle}
      ref={cardRef}
      onMouseDown={disableSwipe ? undefined : handleMouseDown}
      onMouseMove={disableSwipe ? undefined : (isDragging ? handleMouseMove : undefined)}
      onMouseUp={disableSwipe ? undefined : handleMouseUp}
      onTouchStart={disableSwipe ? undefined : handleTouchStart}
      onTouchMove={disableSwipe ? undefined : handleTouchMove}
      onTouchEnd={disableSwipe ? undefined : handleTouchEnd}
    >
      {!disableSwipe && isDragging && dragOffset.x > 50 && (
        <div className="profile-card__swipe-indicator profile-card__swipe-indicator--like" style={{ opacity: likeOpacity }}>
          ❤️ LIKE
        </div>
      )}
      {!disableSwipe && isDragging && dragOffset.x < -50 && (
        <div className="profile-card__swipe-indicator profile-card__swipe-indicator--pass" style={{ opacity: passOpacity }}>
          ✕ PASS
        </div>
      )}
      <div className="profile-card__image-container">
        <CachedImage
          src={getImageUrl(images[currentImageIndex]) || ''}
          alt={`${name}'s profile`}
          className="profile-card__image"
        />
        <div className="profile-card__nav-area profile-card__nav-area--prev" onClick={prevImage} />
        <div className="profile-card__nav-area profile-card__nav-area--next" onClick={nextImage} />
        {images.length > 1 && (
          <div className="profile-card__dots">
            {images.map((_, index) => (
              <span
                key={index}
                className={`profile-card__dot ${index === currentImageIndex ? 'profile-card__dot--active' : ''}`}
              />
            ))}
          </div>
        )}
        {compatibilityScore !== undefined && !hasMultiScores && (
          <div className="profile-card__compatibility">
            <span className="profile-card__compatibility-score">{compatibilityScore}%</span>
            <span className="profile-card__compatibility-label">Match</span>
          </div>
        )}
        {hasMultiScores && (
          <div className="profile-card__compatibility-mini">
            <div className="profile-card__compatibility-mini-item">
              <span className="profile-card__compatibility-mini-icon">🌍</span>
              <span className="profile-card__compatibility-mini-value">
                <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                  {hasProfileEmbedding ? `${compatibilityScoreGlobal}%` : `${fakeGlobal}%`}
                </span>
              </span>
            </div>
            <div className="profile-card__compatibility-mini-item">
              <span className="profile-card__compatibility-mini-icon">❤️</span>
              <span className="profile-card__compatibility-mini-value">
                <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                  {hasProfileEmbedding ? `${compatibilityScoreLove}%` : `${fakeLove}%`}
                </span>
              </span>
            </div>
            <div className="profile-card__compatibility-mini-item">
              <span className="profile-card__compatibility-mini-icon">🤝</span>
              <span className="profile-card__compatibility-mini-value">
                <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                  {hasProfileEmbedding ? `${compatibilityScoreFriendship}%` : `${fakeFriendship}%`}
                </span>
              </span>
            </div>
            <div className="profile-card__compatibility-mini-item">
              <span className="profile-card__compatibility-mini-icon">🔥</span>
              <span className="profile-card__compatibility-mini-value">
                <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                  {hasProfileEmbedding ? `${compatibilityScoreCarnal}%` : `${fakeCarnal}%`}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="profile-card__content">
        <div className="profile-card__header">
          <div className="profile-card__title">
            <h3 className="profile-card__name">{name}</h3>
            <span className="profile-card__age">{age}</span>
          </div>
          {distance !== undefined && (
            <span className="profile-card__distance">{distance} km</span>
          )}
        </div>

        {totalContentPages > 1 ? (
          <>
            {contentPageIndex === 0 ? (
              <>
                {bio && <p className="profile-card__bio">{bio}</p>}
                {interests && interests.length > 0 && (
                  <div className="profile-card__interests">
                    {interests.map((interest, index) => (
                      <span key={index} className="profile-card__interest-tag">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : contentPageIndex === 1 ? (
              <>
                {bio && <p className="profile-card__bio profile-card__bio--full">{bio}</p>}
              </>
            ) : hasMultiScores ? (
              <>
                <div className="profile-card__compatibility-grid">
                  <div className="profile-card__compatibility-badge profile-card__compatibility-badge--global">
                    <div className="profile-card__compatibility-badge-main">
                      <span className="profile-card__compatibility-badge-icon">🌍</span>
                      <span className="profile-card__compatibility-badge-value">
                        <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                          {hasProfileEmbedding ? `${compatibilityScoreGlobal}%` : `${fakeGlobal}%`}
                        </span>
                      </span>
                    </div>
                    <span className="profile-card__compatibility-badge-label">Globale</span>
                  </div>
                  <div className="profile-card__compatibility-badge profile-card__compatibility-badge--love">
                    <div className="profile-card__compatibility-badge-main">
                      <span className="profile-card__compatibility-badge-icon">❤️</span>
                      <span className="profile-card__compatibility-badge-value">
                        <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                          {hasProfileEmbedding ? `${compatibilityScoreLove}%` : `${fakeLove}%`}
                        </span>
                      </span>
                    </div>
                    <span className="profile-card__compatibility-badge-label">Amour</span>
                  </div>
                  <div className="profile-card__compatibility-badge profile-card__compatibility-badge--friendship">
                    <div className="profile-card__compatibility-badge-main">
                      <span className="profile-card__compatibility-badge-icon">🤝</span>
                      <span className="profile-card__compatibility-badge-value">
                        <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                          {hasProfileEmbedding ? `${compatibilityScoreFriendship}%` : `${fakeFriendship}%`}
                        </span>
                      </span>
                    </div>
                    <span className="profile-card__compatibility-badge-label">Amitié</span>
                  </div>
                  <div className="profile-card__compatibility-badge profile-card__compatibility-badge--carnal">
                    <div className="profile-card__compatibility-badge-main">
                      <span className="profile-card__compatibility-badge-icon">🔥</span>
                      <span className="profile-card__compatibility-badge-value">
                        <span className={!hasProfileEmbedding ? 'blurred' : ''}>
                          {hasProfileEmbedding ? `${compatibilityScoreCarnal}%` : `${fakeCarnal}%`}
                        </span>
                      </span>
                    </div>
                    <span className="profile-card__compatibility-badge-label">Charnel</span>
                  </div>
                </div>
                {!hasProfileEmbedding && (
                  <div className="profile-card__alter-message">
                    <p className="profile-card__alter-message-text">
                      {t('discover.noEmbeddingMessage')}
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </>
        ) : (
          <>
            {bio && <p className="profile-card__bio">{bio}</p>}
            {interests && interests.length > 0 && (
              <div className="profile-card__interests">
                {interests.map((interest, index) => (
                  <span key={index} className="profile-card__interest-tag">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {(onLike || onPass || onUndo || onDirectMessage) && (
          <div className="profile-card__actions">
            {onUndo && hasProfileEmbedding && (
              <button
                className="profile-card__action profile-card__action--undo"
                onClick={onUndo}
                disabled={disableUndo}
                title={t('common.undo')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 14L4 9L9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 20V13C20 11.9391 19.5786 10.9217 18.8284 10.1716C18.0783 9.42143 17.0609 9 16 9H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="profile-card__action-badge">👑</span>
              </button>
            )}
            {onPass && (
              <button className="profile-card__action profile-card__action--pass" onClick={handlePassClick}>
                ✕
              </button>
            )}
            {onLike && (
              <button className="profile-card__action profile-card__action--like" onClick={handleLikeClick}>
                ♥
              </button>
            )}
            {onDirectMessage && hasProfileEmbedding && (
              <button
                className="profile-card__action profile-card__action--direct-message"
                onClick={onDirectMessage}
                title={t('common.directMessage')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="profile-card__action-badge">👑</span>
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmNavigate}
        message={confirmAction === 'like' ? t('discover.noEmbeddingLikeConfirm') : t('discover.noEmbeddingPassConfirm')}
        confirmText={t('discover.chatWithAlter')}
        cancelText={t('discover.notNow')}
        icon={<Logo variant="icon" size={48} />}
      />
    </div>
  )
}