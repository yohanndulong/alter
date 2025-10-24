import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ProfileModal, Logo, CachedImage, Badge, LoadingMoreIndicator } from '@/components'
import { matchingService } from '@/services/matching'
import { Match } from '@/types'
import { useToast } from '@/hooks'
import { formatRelativeTime } from '@/utils/date'
import { getImageUrl } from '@/utils/image'
import { matchesStorage } from '@/utils/matchesStorage'
import './Matches.css'

export const Matches: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { error: showError } = useToast()

  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [conversationsStatus, setConversationsStatus] = useState<{
    activeConversations: number
    maxConversations: number
    remainingSlots: number
    canLike: boolean
  } | null>(null)

  useEffect(() => {
    loadMatchesWithCache()
    loadConversationsStatus()
  }, [])

  const loadConversationsStatus = async () => {
    try {
      const status = await matchingService.getConversationsStatus()
      setConversationsStatus(status)
    } catch (err) {
      console.error('Error loading conversations status:', err)
    }
  }

  const sortMatches = (data: Match[]): Match[] => {
    return data.sort((a, b) => {
      if (!a.lastMessageAt) return 1
      if (!b.lastMessageAt) return -1
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })
  }

  const loadMatchesWithCache = async () => {
    try {
      // 1. Charger immédiatement le cache s'il existe
      const { matches: cachedMatches, shouldRefresh } = await matchesStorage.loadMatchesWithStatus()

      if (cachedMatches && cachedMatches.length > 0) {
        // Afficher les données en cache immédiatement
        const sortedCached = sortMatches(cachedMatches)
        setMatches(sortedCached)
        setIsLoading(false)

        // Si le cache est valide, on passe en mode rafraîchissement
        if (!shouldRefresh) {
          return
        }
        setIsRefreshing(true)
      }

      // 2. Charger les données fraîches depuis l'API
      const freshData = await matchingService.getMatches()
      const sortedData = sortMatches(freshData)

      // 3. Mettre à jour l'état et le cache
      setMatches(sortedData)
      await matchesStorage.saveMatches(freshData)
    } catch (err: any) {
      // Ne montrer l'erreur que si on n'a pas de cache
      if (matches.length === 0) {
        showError(t('common.error'))
      }
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleMatchClick = (matchId: string) => {
    navigate(`/chat/${matchId}`)
  }

  const handleProfileClick = (match: Match) => {
    setSelectedMatch(match)
  }

  const handleCloseModal = () => {
    setSelectedMatch(null)
  }

  const handleOpenChat = () => {
    if (selectedMatch) {
      navigate(`/chat/${selectedMatch.id}`)
    }
  }

  if (isLoading && matches.length === 0) {
    return (
      <div className="matches-container">
        <div className="matches-loading-container">
          <LoadingMoreIndicator text={t('common.loading')} />
        </div>
      </div>
    )
  }

  if (matches.length === 0 && !isLoading) {
    return (
      <div className="matches-container">
        <div className="matches-header">
          <div className="matches-header-info">
            <div className="matches-avatar">
              <Logo variant="icon" size={28} />
            </div>
            <h1 className="matches-title">{t('matches.title')}</h1>
          </div>
        </div>
        <div className="matches-empty">
          <div className="matches-empty-icon">💬</div>
          <h2 className="matches-empty-title">{t('matches.noMatches')}</h2>
          <p className="matches-empty-text">{t('matches.startSwiping')}</p>
          <button className="matches-empty-button" onClick={() => navigate('/discover')}>
            {t('discover.title')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="matches-container">
      <div className="matches-header">
        <div className="matches-header-info">
          <div className="matches-avatar">
            <Logo variant="icon" size={28} />
          </div>
          <h1 className="matches-title">{t('matches.title')}</h1>
        </div>
      </div>

      <div className="matches-list">
        {matches.map((match) => (
          <div
            key={match.id}
            className="matches-conversation"
            onClick={() => handleMatchClick(match.id)}
          >
            <div
              className="matches-conversation-avatar"
              onClick={(e) => {
                e.stopPropagation()
                handleProfileClick(match)
              }}
            >
              {match.matchedUser.images?.[0] ? (
                <CachedImage
                  src={getImageUrl(match.matchedUser.images[0]) || ''}
                  alt={match.matchedUser.name}
                  className="matches-conversation-avatar-image"
                />
              ) : (
                <div className="matches-conversation-avatar-placeholder">
                  {match.matchedUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <Badge count={match.unreadCount} position="top-right" size="md" variant="error" />
            </div>

            <div className="matches-conversation-content">
              <div className="matches-conversation-header">
                <div className="matches-conversation-name-container">
                  <h3 className="matches-conversation-name">
                    {match.matchedUser.name}, {match.matchedUser.age}
                  </h3>
                  <div className="matches-conversation-compatibility">
                    <span className="matches-conversation-compatibility-icon">🌍</span>
                    <span className="matches-conversation-compatibility-value">
                      {match.compatibilityScoreGlobal || match.compatibilityScore}%
                    </span>
                  </div>
                </div>
                {match.lastMessageAt && (
                  <span className="matches-conversation-time">
                    {formatRelativeTime(match.lastMessageAt)}
                  </span>
                )}
              </div>

              {match.lastMessage && (
                <p className="matches-conversation-message">
                  {match.lastMessage}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {conversationsStatus && (
        <div className={`conversations-limit-info ${conversationsStatus.activeConversations >= conversationsStatus.maxConversations ? 'limit-reached' : conversationsStatus.canLike && conversationsStatus.remainingSlots > 0 ? 'can-like-again' : ''}`}>
          <div className="conversations-limit-visual">
            <div className="conversations-limit-emoji">
              {conversationsStatus.canLike && conversationsStatus.remainingSlots > 0 ? '✨' : conversationsStatus.canLike ? '💬' : '🎯'}
            </div>
            <div className="conversations-limit-counter">
              <span className="counter-current">{conversationsStatus.activeConversations}</span>
              <span className="counter-separator">/</span>
              <span className="counter-max">{conversationsStatus.maxConversations}</span>
            </div>
          </div>
          <div className="conversations-limit-content">
            <h3 className="conversations-limit-title">
              {conversationsStatus.canLike && conversationsStatus.remainingSlots > 0
                ? t('matches.canLikeAgain', { slots: conversationsStatus.remainingSlots })
                : conversationsStatus.canLike
                ? t('matches.conversationsLimit')
                : t('matches.conversationsLimitReached', {
                    active: conversationsStatus.activeConversations,
                    max: conversationsStatus.maxConversations,
                  })}
            </h3>
            {!(conversationsStatus.canLike && conversationsStatus.remainingSlots > 0) && (
              <p className="conversations-limit-text">
                {t('matches.conversationsLimitInfo', {
                  active: conversationsStatus.activeConversations,
                  max: conversationsStatus.maxConversations,
                })}
              </p>
            )}
            {conversationsStatus.canLike && conversationsStatus.remainingSlots > 0 && (
              <button
                className="conversations-limit-action-button"
                onClick={() => navigate('/discover')}
              >
                {t('discover.title')}
              </button>
            )}
          </div>
        </div>
      )}

      {selectedMatch && (
        <ProfileModal
          isOpen={true}
          onClose={handleCloseModal}
          profile={selectedMatch.matchedUser}
          onLike={handleOpenChat}
          showActions={true}
        />
      )}
    </div>
  )
}