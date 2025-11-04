import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Modal, ProfileModal, ConfirmDialog, VoiceMessage, PhotoMessage, VoiceRecorder, CameraCapture, LoadingMoreIndicator } from '@/components'
import { chatService } from '@/services/chat'
import { matchingService } from '@/services/matching'
import { Message, Match, PhotoViewMode } from '@/types'
import { useToast, usePrivacyScreen, useBackButtonNavigation, useMessages, useAddMessageToCache, chatKeys } from '@/hooks'
import { userChatStorage } from '@/utils/userChatStorage'
import { formatTime } from '@/utils/date'
import { getImageUrl } from '@/utils/image'
import { useAuth } from '@/contexts/AuthContext'
import { CapturedPhoto } from '@/services/camera'
import './Chat.css'

export const Chat: React.FC = () => {
  const { t } = useTranslation()
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const { error: showError, success } = useToast()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [match, setMatch] = useState<Match | null>(null)
  const [input, setInput] = useState('')

  // React Query - Charger les messages avec cache automatique
  const queryClient = useQueryClient()
  const { data: messages = [], isLoading } = useMessages(matchId)
  const addMessageToCache = useAddMessageToCache()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showQualityModal, setShowQualityModal] = useState(false)
  const [qualityDetails, setQualityDetails] = useState<any>(null)
  const [isLoadingQuality, setIsLoadingQuality] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [deliveredMessages, setDeliveredMessages] = useState<Set<string>>(new Set())
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set())
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const lastScrollHeight = useRef<number>(0)

  const conversationQuality = match?.conversationQualityScore || 75

  // Activer la protection contre les captures d'écran
  usePrivacyScreen(true)

  // Gérer le bouton retour - retourner à la liste des matches
  useBackButtonNavigation('/matches')

  useEffect(() => {
    if (!matchId || !user?.id) return

    loadMatch()

    // Rejoindre la room du match spécifique
    // Note: le WebSocket est déjà initialisé globalement par WebSocketContext
    chatService.joinMatch(matchId)

    // Fonction handler UNIQUEMENT pour les indicateurs visuels locaux (typing, delivered, read)
    // Les messages sont gérés par WebSocketContext qui met à jour IndexedDB + React Query
    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId !== user.id) {
        setIsOtherUserTyping(data.isTyping)
      }
    }

    const handleMessageDelivered = (data: { messageId: string; deliveredTo: string }) => {
      setDeliveredMessages(prev => new Set([...prev, data.messageId]))
    }

    const handleMessageRead = (data: { matchId: string; readBy: string }) => {
      if (data.matchId === matchId) {
        setReadMessages(prev => {
          const newSet = new Set(prev)
          messages.forEach(msg => {
            if (msg.senderId === user.id) {
              newSet.add(msg.id)
            }
          })
          return newSet
        })
      }
    }

    // Enregistrer les listeners pour les indicateurs visuels uniquement
    chatService.onTyping(handleTyping)
    chatService.onMessageDelivered(handleMessageDelivered)
    chatService.onMessageRead(handleMessageRead)

    // Cleanup : retirer les listeners (mais NE PAS déconnecter le socket global)
    return () => {
      const socket = chatService.initChatSocket()
      if (socket) {
        socket.off('user-typing', handleTyping)
        socket.off('message:delivered', handleMessageDelivered)
        socket.off('message:read', handleMessageRead)
      }
      // NE PAS déconnecter le socket, il reste actif globalement
    }
  }, [matchId, user?.id, messages])

  // Scroll vers le premier message non lu au chargement initial
  const hasScrolledToUnread = useRef(false)

  useEffect(() => {
    if (!messages || messages.length === 0 || !user || !match || hasScrolledToUnread.current) {
      return
    }

    // Utiliser unreadCount du match (avant qu'il soit marqué comme lu)
    const hasUnreadMessages = match.unreadCount > 0

    if (hasUnreadMessages) {
      // Il y a des messages non lus, trouver le premier
      const firstUnreadIndex = messages.findIndex(
        msg => msg.senderId !== user.id && !msg.read
      )

      if (firstUnreadIndex !== -1 && firstUnreadIndex > 0) {
        // Scroller vers le premier message non lu
        setTimeout(() => {
          const messageElements = document.querySelectorAll('.chat-message')
          const firstUnreadElement = messageElements[firstUnreadIndex] as HTMLElement
          if (firstUnreadElement) {
            firstUnreadElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
            hasScrolledToUnread.current = true
          }
        }, 100)
      } else {
        // Fallback: scroller vers le bas
        setTimeout(() => scrollToBottom(), 100)
        hasScrolledToUnread.current = true
      }
    } else {
      // Tout est déjà lu, scroller vers le bas
      setTimeout(() => scrollToBottom(), 100)
      hasScrolledToUnread.current = true
    }
  }, [messages, user, match])

  // Réinitialiser le flag quand on change de conversation
  useEffect(() => {
    hasScrolledToUnread.current = false
  }, [matchId])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)

      // Détecter si l'utilisateur est en haut (lazy loading)
      const isNearTop = scrollTop < 100
      if (isNearTop && !isLoadingMore && hasMoreMessages) {
        loadMoreMessages()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [isLoadingMore, hasMoreMessages])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const loadMatch = async () => {
    if (!matchId) return

    try {
      const matches = await matchingService.getMatches()
      const currentMatch = matches.find(m => m.id === matchId)
      if (currentMatch) {
        setMatch(currentMatch)
      } else {
        navigate('/matches')
      }
    } catch (err) {
      showError(t('common.error'))
    }
  }

  // Track si on a déjà marqué comme lu pour éviter les appels répétés
  const hasMarkedAsRead = useRef(false)

  // Initialiser les statuts delivered/read depuis les messages
  useEffect(() => {
    if (!messages || messages.length === 0) return

    const delivered = new Set<string>()
    const read = new Set<string>()

    messages.forEach(msg => {
      if (msg.delivered) delivered.add(msg.id)
      if (msg.read) read.add(msg.id)
    })

    setDeliveredMessages(delivered)
    setReadMessages(read)

    setTimeout(() => scrollToBottom(), 100)
  }, [messages])

  // Marquer comme lu UNIQUEMENT au chargement initial ou changement de match
  // Le WebSocket notifiera UnreadCountContext qui mettra à jour le compteur
  useEffect(() => {
    if (matchId && messages.length > 0 && !hasMarkedAsRead.current) {
      console.log('📖 Sending message-read event via WebSocket for match:', matchId)
      chatService.sendMessageRead(matchId, messages[messages.length - 1].id)
      hasMarkedAsRead.current = true
    }
  }, [matchId, messages.length])

  // Reset le flag quand on change de match
  useEffect(() => {
    hasMarkedAsRead.current = false
  }, [matchId])

  const loadMoreMessages = async () => {
    if (!matchId || !user?.id || isLoadingMore || !hasMoreMessages) return

    setIsLoadingMore(true)

    try {
      // Obtenir l'ID du message le plus ancien
      const oldestMessageId = messages.length > 0 ? messages[0].id : undefined

      // Charger les messages plus anciens
      const olderMessages = await chatService.getMatchMessages(matchId, 30, oldestMessageId)

      if (olderMessages.length === 0) {
        setHasMoreMessages(false)
      } else {
        // Sauvegarder la hauteur actuelle du scroll
        const container = messagesContainerRef.current
        if (container) {
          lastScrollHeight.current = container.scrollHeight
        }

        // Ajouter les anciens messages au début du cache React Query
        const updatedMessages = [...olderMessages, ...messages]
        queryClient.setQueryData<Message[]>(
          chatKeys.messages(matchId),
          updatedMessages
        )

        // Mettre à jour le secure storage avec tous les messages
        await userChatStorage.saveMessages(matchId, updatedMessages)

        // Restaurer la position du scroll après que les nouveaux messages soient rendus
        setTimeout(() => {
          if (container && lastScrollHeight.current) {
            const newScrollHeight = container.scrollHeight
            const scrollDiff = newScrollHeight - lastScrollHeight.current
            container.scrollTop = scrollDiff
          }
        }, 0)
      }
    } catch (err) {
      console.error('Failed to load more messages:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight()

    // Gérer l'indicateur de frappe
    if (matchId && input.length > 0) {
      // Envoyer "typing: true"
      chatService.sendTyping(matchId, true)

      // Clear le timeout précédent
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Envoyer "typing: false" après 2 secondes d'inactivité
      typingTimeoutRef.current = setTimeout(() => {
        chatService.sendTyping(matchId, false)
      }, 2000)
    } else if (matchId && input.length === 0) {
      // Si l'input est vide, arrêter immédiatement l'indicateur
      chatService.sendTyping(matchId, false)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [input, matchId])

  const handleSend = () => {
    if (!input.trim() || !matchId || !match || !user) return

    const messageContent = input.trim()
    setInput('')

    // Créer un message optimiste avec un ID temporaire
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}-${Math.random()}`,
      content: messageContent,
      senderId: user.id,
      receiverId: match.matchedUserId,
      matchId,
      type: 'text',
      createdAt: new Date(),
      delivered: false,
      read: false,
    }

    // Ajouter immédiatement au cache pour affichage instantané
    addMessageToCache(matchId, optimisticMessage)

    // Envoyer le message via WebSocket (userId extrait du JWT côté serveur)
    chatService.sendMessageWS(
      matchId,
      match.matchedUserId,
      messageContent
    )

    // Le message sera remplacé par le vrai message quand il arrivera via WebSocket
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Ctrl+Enter ou Cmd+Enter pour envoyer
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        handleSend()
      }
      // Enter seul = retour à la ligne (comportement par défaut du textarea)
    }
  }

  const getQualityLevel = (score: number): string => {
    if (score >= 90) return t('chat.qualityExcellent')
    if (score >= 75) return t('chat.qualityVeryGood')
    if (score >= 60) return t('chat.qualityGood')
    if (score >= 40) return t('chat.qualityAverage')
    return t('chat.qualityPoor')
  }

  const getQualityColor = (score: number): string => {
    if (score >= 90) return '#10b981' // green
    if (score >= 75) return '#3b82f6' // blue
    if (score >= 60) return '#8b5cf6' // purple
    if (score >= 40) return '#f59e0b' // orange
    return '#ef4444' // red
  }

  const renderQualityIcon = (score: number) => {
    const color = getQualityColor(score)

    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`qualityGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.6 }} />
          </linearGradient>
        </defs>

        {/* Cercle de progression */}
        <circle
          cx="16"
          cy="16"
          r="12"
          stroke={`url(#qualityGradient-${score})`}
          strokeWidth="3"
          fill="none"
          strokeDasharray={`${(score / 100) * 75.4} 75.4`}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
        />

        {/* Icône centrale selon le score */}
        {score >= 90 ? (
          // Étoile pour excellent
          <path d="M16 6 L18 12 L24 12 L19 16 L21 22 L16 18 L11 22 L13 16 L8 12 L14 12 Z" fill={color} />
        ) : score >= 75 ? (
          // Coeur pour très bien - réduit pour être à l'intérieur du cercle
          <path d="M16 21 C16 21 11 17.5 11 13.5 C11 11.5 12.5 10.5 14 11.5 C15 12 16 13.5 16 13.5 C16 13.5 17 12 18 11.5 C19.5 10.5 21 11.5 21 13.5 C21 17.5 16 21 16 21 Z" fill={color} />
        ) : score >= 60 ? (
          // Pouce levé pour bien
          <path d="M14 10 L14 6 C14 5 15 4 16 4 C17 4 18 5 18 6 L18 10 M14 10 L14 18 L20 18 C21 18 22 17 22 16 L22 12 C22 11 21 10 20 10 L18 10 M14 18 L10 18 C9 18 8 17 8 16 L8 14 C8 13 9 12 10 12 L14 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : score >= 40 ? (
          // Point d'exclamation pour moyen
          <g>
            <circle cx="16" cy="22" r="1.5" fill={color} />
            <rect x="15" y="10" width="2" height="9" rx="1" fill={color} />
          </g>
        ) : (
          // Triangle d'alerte pour à améliorer
          <g>
            <path d="M16 8 L24 24 L8 24 Z" stroke={color} strokeWidth="2" fill="none" />
            <circle cx="16" cy="21" r="1" fill={color} />
            <rect x="15.5" y="14" width="1" height="5" fill={color} />
          </g>
        )}
      </svg>
    )
  }

  const handleQualityClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher l'ouverture du profil
    if (!matchId) return

    setShowQualityModal(true)
    setIsLoadingQuality(true)

    try {
      const result = await chatService.analyzeConversationQuality(matchId)
      console.log('Quality analysis result:', result)

      // Adapter au nouveau format de l'API
      setQualityDetails({
        score: result.overallScore ?? 0,
        feedback: result.analysis || 'Analyse non disponible'
      })
    } catch (err) {
      console.error('Failed to analyze conversation quality:', err)
      showError('Impossible d\'analyser la qualité de la conversation')
      setShowQualityModal(false)
    } finally {
      setIsLoadingQuality(false)
    }
  }

  const handleProfileClick = () => {
    setShowProfileModal(true)
  }

  const handleDeleteConversation = async () => {
    if (!matchId) return

    try {
      const result = await matchingService.unmatch(matchId)

      // Afficher un message de succès avec les informations sur les slots
      if (result.canLikeAgain && result.remainingSlots > 0) {
        success(t('matches.canLikeAgain', { slots: result.remainingSlots }))
      } else {
        success(t('matches.conversationDeleted'))
      }

      // Rediriger vers la page des matchs
      navigate('/matches')
    } catch (err) {
      showError(t('common.error'))
    }
  }

  const handleSendVoice = async (audioBlob: Blob, duration: number) => {
    if (!matchId) return

    try {
      await chatService.sendVoiceMessage(matchId, audioBlob, duration)
      success('Message vocal envoyé')
    } catch (err) {
      console.error('Failed to send voice message:', err)
      throw err
    }
  }

  const handleSendPhoto = async (photo: CapturedPhoto, viewMode: PhotoViewMode, viewDuration?: number) => {
    if (!matchId) return

    try {
      await chatService.sendPhotoMessage(matchId, photo.blob, {
        isReel: photo.isReel,
        viewMode,
        viewDuration
      })
      success('Photo envoyée')
    } catch (err) {
      console.error('Failed to send photo:', err)
      throw err
    }
  }

  if (isLoading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <LoadingMoreIndicator text={t('common.loading')} />
        </div>
      </div>
    )
  }

  if (!match) {
    return null
  }

  return (
    <div className="chat-container" data-user-id={user?.id}>
      <div className="chat">
        <div className="chat-header">
          <Button variant="ghost" onClick={() => navigate('/matches')}>
            ←
          </Button>
          <div className="chat-header-info" onClick={handleProfileClick}>
            <div className="chat-avatar">
              {match.matchedUser.images?.[0] ? (
                <img
                  src={getImageUrl(match.matchedUser.images[0]) || ''}
                  alt={match.matchedUser.name}
                  className="chat-avatar-image"
                />
              ) : (
                <div className="chat-avatar-placeholder">
                  {match.matchedUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="chat-header-details">
              <div className="chat-header-name-container">
                <h2 className="chat-header-name">{match.matchedUser.name}</h2>
                <span className="chat-header-status-dot chat-header-status-dot--online" />
              </div>
            </div>
          </div>
          <button
            className="chat-quality-icon-button"
            onClick={handleQualityClick}
            title={t('chat.conversationQuality')}
          >
            {renderQualityIcon(conversationQuality)}
          </button>
          <div className="chat-menu-container" ref={menuRef}>
            <button
              className="chat-menu-button"
              onClick={() => setShowMenu(!showMenu)}
              title={t('common.menu')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
              </svg>
            </button>
            {showMenu && (
              <div className="chat-menu-dropdown">
                <button
                  className="chat-menu-item"
                  onClick={() => {
                    setShowMenu(false)
                    handleProfileClick()
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t('chat.viewProfile')}
                </button>
                <button
                  className="chat-menu-item chat-menu-item--danger"
                  onClick={() => {
                    setShowMenu(false)
                    setShowDeleteDialog(true)
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t('matches.deleteConversationAction')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="chat-messages" ref={messagesContainerRef}>
          {isLoadingMore && (
            <LoadingMoreIndicator text={t('chat.loadingMore')} />
          )}
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p className="chat-empty-text">{t('chat.noMessages')}</p>
            </div>
          ) : (
            messages.map(message => {
              const isSent = message.senderId === user?.id
              const isReceiver = !isSent
              const isDelivered = deliveredMessages.has(message.id)
              const isRead = readMessages.has(message.id)

              return (
                <div
                  key={message.id}
                  className={`chat-message ${message.type === 'system' ? 'chat-message--system' : `chat-message--${isSent ? 'sent' : 'received'}`}`}
                >
                  <div className="chat-message-content">
                    {message.type === 'text' && (
                      <p className="chat-message-text">{message.content}</p>
                    )}
                    {message.type === 'voice' && message.media && (
                      <VoiceMessage media={message.media} isSent={isSent} />
                    )}
                    {message.type === 'photo' && message.media && matchId && (
                      <PhotoMessage
                        media={message.media}
                        isSent={isSent}
                        matchId={matchId}
                        isReceiver={isReceiver}
                      />
                    )}
                    {message.type === 'system' && (
                      <p className="chat-message-text chat-message-text--system">{message.content}</p>
                    )}
                    <span className="chat-message-time">
                      {formatTime(message.createdAt)}
                      {isSent && (
                        <span className="chat-message-status">
                          {isRead ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="chat-check-read">
                              <path d="M2 8L5 11L9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 8L10 11L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : isDelivered ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="chat-check-delivered">
                              <path d="M2 8L5 11L9 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M7 8L10 11L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="chat-check-sent">
                              <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )
            })
          )}
          {isOtherUserTyping && (
            <div className="chat-typing-indicator">
              <div className="chat-typing-bubble">
                <div className="chat-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button
            className="chat-scroll-to-bottom"
            onClick={scrollToBottom}
            title={t('common.scrollToBottom')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <div className="chat-input">
          <button
            className="chat-input-action-button"
            onClick={() => setShowCameraCapture(true)}
            title={t('common.sendPhoto')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="chat-input-action-button"
            onClick={() => setShowVoiceRecorder(true)}
            title={t('common.sendVoiceMessage')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            placeholder={t('chat.typeMessage')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={1}
          />
          <button
            className="chat-send-button"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            ➤
          </button>
        </div>
      </div>

      <Modal
        isOpen={showQualityModal}
        onClose={() => setShowQualityModal(false)}
        size="md"
      >
        <div className="chat-quality-modal">
          <h2 className="chat-quality-modal-title">{t('chat.qualityDetails')}</h2>

          {isLoadingQuality ? (
            <div className="chat-quality-loading">
              <p>{t('chat.qualityAnalyzing')}</p>
            </div>
          ) : qualityDetails ? (
            <>
              <div className="chat-quality-overall">
                <div className="chat-quality-overall-score">
                  <span className="chat-quality-score-value" style={{ color: getQualityColor(qualityDetails.score) }}>
                    {qualityDetails.score}%
                  </span>
                  <span className="chat-quality-score-label">{getQualityLevel(qualityDetails.score)}</span>
                </div>
              </div>

              <div className="chat-quality-analysis">
                <h3 className="chat-quality-analysis-title">Analyse IA</h3>
                <p className="chat-quality-analysis-text">{qualityDetails.feedback}</p>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      {match && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          profile={match.matchedUser}
          showActions={false}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConversation}
        title={t('matches.deleteConversationTitle')}
        message={t('matches.deleteConversationMessage')}
        confirmText={t('matches.deleteConversationConfirm')}
        cancelText={t('common.cancel')}
        icon="🗑️"
      />

      <VoiceRecorder
        isOpen={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onSend={handleSendVoice}
      />

      <CameraCapture
        isOpen={showCameraCapture}
        onClose={() => setShowCameraCapture(false)}
        onSend={handleSendPhoto}
      />
    </div>
  )
}