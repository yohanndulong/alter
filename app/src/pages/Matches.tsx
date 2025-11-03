import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { ProfileModal, Logo, CachedImage, Badge, LoadingMoreIndicator } from '@/components'
import { Match } from '@/types'
import { useMatches, useConversationsStatus, chatKeys } from '@/hooks'
import { formatRelativeTime } from '@/utils/date'
import { getImageUrl } from '@/utils/image'
import { chatService } from '@/services/chat'
import { userChatStorage } from '@/utils/userChatStorage'
import './Matches.css'

export const Matches: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)

  // Utilisation de React Query - cache automatique de 5 minutes !
  const { data: matches = [], isLoading } = useMatches()
  const { data: conversationsStatus } = useConversationsStatus()

  // Tri des matches par date
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      if (!a.lastMessageAt) return 1
      if (!b.lastMessageAt) return -1
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    })
  }, [matches])

  // Précharger les messages des 3 premières conversations en arrière-plan
  useEffect(() => {
    if (sortedMatches.length === 0) return

    const prefetchConversations = async () => {
      // Prendre les 3 premières conversations (les plus récentes)
      const topMatches = sortedMatches.slice(0, 3)

      for (const match of topMatches) {
        try {
          // Vérifier si on a déjà des messages en cache local
          const cachedMessages = await userChatStorage.loadMessages(match.id)

          if (cachedMessages.length > 0) {
            // Pré-remplir le cache React Query avec les données locales
            queryClient.setQueryData(
              chatKeys.messages(match.id),
              cachedMessages
            )
          }

          // Précharger depuis le serveur en arrière-plan (ne bloque pas l'UI)
          queryClient.prefetchQuery({
            queryKey: chatKeys.messages(match.id),
            queryFn: async () => {
              const messages = await chatService.getMatchMessages(match.id, 50)
              // Sauvegarder dans le cache persistant
              await userChatStorage.saveMessages(match.id, messages)
              return messages
            },
            staleTime: 2 * 60 * 1000, // 2 minutes
          })
        } catch (error) {
          console.error(`Failed to prefetch messages for match ${match.id}:`, error)
        }
      }
    }

    // Attendre 500ms avant de précharger (pour ne pas ralentir le premier affichage)
    const timeoutId = setTimeout(prefetchConversations, 500)
    return () => clearTimeout(timeoutId)
  }, [sortedMatches, queryClient])

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

  if (isLoading) {
    return (
      <div className="matches-container">
        <div className="matches-loading-container">
          <LoadingMoreIndicator text={t('common.loading')} />
        </div>
      </div>
    )
  }

  if (sortedMatches.length === 0) {
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
        {sortedMatches.map((match) => {
          // Vérifier si le match est nouveau (< 24h)
          const isNewMatch = () => {
            const dayInMs = 24 * 60 * 60 * 1000
            return Date.now() - new Date(match.matchedAt).getTime() < dayInMs
          }

          return (
            <div
              key={match.id}
              className={`matches-conversation ${isNewMatch() ? 'matches-conversation--new' : ''}`}
              onClick={() => handleMatchClick(match.id)}
            >
              {isNewMatch() && (
                <div className="matches-conversation-new-badge">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="7" fill="url(#newGradient)" />
                    <path d="M8 3L9.5 6.5L13 7L10.5 9.5L11 13L8 11L5 13L5.5 9.5L3 7L6.5 6.5L8 3Z" fill="white" />
                    <defs>
                      <linearGradient id="newGradient" x1="0" y1="0" x2="16" y2="16">
                        <stop offset="0%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FFA500" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="matches-conversation-new-text">{t('matches.new')}</span>
                </div>
              )}
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
          )
        })}
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
