import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Logo, LoadingMoreIndicator, ShareButton } from '@/components'
import { chatService } from '@/services/chat'
import { ChatMessage } from '@/types'
import { useBackButtonNavigation, useAlterMessages, useAddAlterMessageToCache, chatKeys } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { parseMarkdown } from '@/utils/markdown'
import { formatMessageTime } from '@/utils/date'
import { alterChatStorage } from '@/utils/alterChatStorage'
import './AlterChat.css'

export const AlterChat: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const intentionMenuRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // React Query - Charger les messages avec cache automatique
  const queryClient = useQueryClient()
  const { data: messages = [], isLoading } = useAlterMessages()
  const addMessageToCache = useAddAlterMessageToCache()

  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [intention, setIntention] = useState<'personality' | 'friendship' | 'love' | 'carnal'>('personality')
  const [showIntentionMenu, setShowIntentionMenu] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<{ [messageId: string]: string[] }>({})
  const [profileState, setProfileState] = useState<any>(null)
  const [showProfileDetails, setShowProfileDetails] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastScrollHeight = useRef<number>(0)

  // Gérer le bouton retour - retourner à discover
  useBackButtonNavigation('/discover')

  // Utiliser useRef pour stabiliser addMessageToCache et éviter les reconnexions WebSocket
  const addMessageToCacheRef = useRef(addMessageToCache)

  useEffect(() => {
    addMessageToCacheRef.current = addMessageToCache
  }, [addMessageToCache])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id) return

    console.log('🟢 AlterChat: Registering message listener')

    // Le WebSocket est déjà initialisé par WebSocketProvider
    // On enregistre juste le listener pour les messages
    const handleAlterMessage = (message: ChatMessage) => {
      // Si c'est un message utilisateur du serveur, supprimer les messages optimistes temporaires
      if (message.role === 'user') {
        queryClient.setQueryData<ChatMessage[]>(
          chatKeys.alterMessages(),
          (old = []) => {
            // Filtrer les messages temporaires avec le même contenu
            const filtered = old.filter(m =>
              !(m.id.startsWith('temp-') && m.content === message.content && m.role === 'user')
            )
            // Ajouter le vrai message si pas déjà présent
            const exists = filtered.some(m => m.id === message.id)
            return exists ? filtered : [...filtered, message]
          }
        )
      } else {
        // Pour les messages assistant, ajouter normalement
        addMessageToCacheRef.current(message)
      }

      // Only stop loading indicator when Alter (assistant) responds
      if (message.role === 'assistant') {
        setIsSending(false)
      }
    }

    chatService.onAlterMessage(handleAlterMessage)

    // Note: React Query charge automatiquement l'historique via useAlterMessages()

    // ⚠️ PAS de cleanup: le WebSocket Alter Chat reste connecté pour les autres pages
    // Il sera déconnecté uniquement au logout
  }, [user?.id, queryClient])

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
      // Update profile state from the latest assistant message
      const latestProfileState = [...messages]
        .reverse()
        .find(m => m.role === 'assistant' && m.profileState)?.profileState
      if (latestProfileState) {
        setProfileState(latestProfileState)
      }
    }
  }, [messages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      if (intentionMenuRef.current && !intentionMenuRef.current.contains(event.target as Node)) {
        setShowIntentionMenu(false)
      }
    }

    if (showIntentionMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showIntentionMenu])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showProfileDetails) {
        setShowProfileDetails(false)
      }
    }

    if (showProfileDetails) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showProfileDetails])

  // Initialiser le message de bienvenue si aucun message n'existe
  useEffect(() => {
    if (!isLoading && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant' as const,
        content: t('chat.alterWelcome'),
        timestamp: new Date(),
      }
      addMessageToCache(welcomeMessage)
    }
  }, [isLoading, messages.length])

  const loadMoreMessages = async () => {
    if (!user?.id || isLoadingMore || !hasMoreMessages) return

    setIsLoadingMore(true)

    try {
      // Obtenir l'ID du message le plus ancien
      const oldestMessageId = messages.length > 0 ? messages[0].id : undefined

      // Charger les messages plus anciens
      const olderMessages = await chatService.loadAlterHistory(30, oldestMessageId)

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
        queryClient.setQueryData<ChatMessage[]>(
          chatKeys.alterMessages(),
          updatedMessages
        )

        // Mettre à jour le secure storage avec tous les messages
        await alterChatStorage.saveMessages(updatedMessages)

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
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || isSending || !user?.id) return

    const content = input.trim()
    setInput('')
    setIsSending(true)

    // 🚀 OPTIMISTIC UPDATE: Ajouter immédiatement le message de l'utilisateur au cache
    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    // Ajouter au cache pour affichage instantané
    addMessageToCache(optimisticUserMessage)

    // Envoyer via WebSocket (le serveur renverra le vrai message avec l'ID définitif)
    chatService.sendAlterMessage(content)
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

  const handleOptionClick = (option: string, messageId: string, selectionType?: 'single' | 'multiple' | 'freetext') => {
    if (selectionType === 'freetext') {
      // Ne rien faire pour les réponses libres
      return
    }

    if (selectionType === 'multiple') {
      // Mode multiple: toggle la sélection
      setSelectedOptions(prev => {
        const current = prev[messageId] || []
        const isSelected = current.includes(option)

        if (isSelected) {
          // Désélectionner
          return {
            ...prev,
            [messageId]: current.filter(o => o !== option)
          }
        } else {
          // Sélectionner
          return {
            ...prev,
            [messageId]: [...current, option]
          }
        }
      })
    } else {
      // Mode single: envoi immédiat
      handleSendOptions([option], messageId)
    }
  }

  const handleSendOptions = async (options: string[], questionId: string) => {
    if (!user?.id) return

    const content = options.join(', ')

    setSelectedOptions(prev => {
      const newState = { ...prev }
      delete newState[questionId]
      return newState
    })
    setIsSending(true)

    // 🚀 OPTIMISTIC UPDATE: Ajouter immédiatement le message de l'utilisateur au cache
    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }

    // Ajouter au cache pour affichage instantané
    addMessageToCache(optimisticUserMessage)

    // Envoyer via WebSocket (userId extrait du JWT côté serveur)
    chatService.sendAlterMessage(content)
  }

  const getIntentionLabel = (key: 'personality' | 'friendship' | 'love' | 'carnal') => {
    const labels = {
      personality: t('chat.intentionPersonality'),
      friendship: t('chat.intentionFriendship'),
      love: t('chat.intentionLove'),
      carnal: t('chat.intentionCarnal'),
    }
    return labels[key]
  }

  const handleIntentionChange = (newIntention: 'personality' | 'friendship' | 'love' | 'carnal') => {
    if (!user?.id || newIntention === intention) return

    setIntention(newIntention)
    setShowIntentionMenu(false)
    setIsSending(true)

    // 🚀 OPTIMISTIC UPDATE: Ajouter immédiatement le message de l'utilisateur au cache
    const intentionMessage = `Je souhaite maintenant explorer l'aspect ${getIntentionLabel(newIntention)} de mon profil.`

    const optimisticUserMessage: ChatMessage = {
      id: `temp-${Date.now()}-${Math.random()}`,
      role: 'user',
      content: intentionMessage,
      timestamp: new Date(),
    }

    // Ajouter au cache pour affichage instantané
    addMessageToCache(optimisticUserMessage)

    // Envoyer au LLM (userId extrait du JWT côté serveur)
    chatService.sendAlterMessage(intentionMessage)
  }

  const getIntentionIcon = (key: 'personality' | 'friendship' | 'love' | 'carnal') => {
    const icons = {
      personality: '🧠',
      friendship: '🤝',
      love: '❤️',
      carnal: '🔥',
    }
    return icons[key]
  }

  if (isLoading) {
    return (
      <div className="alter-chat-container">
        <div className="alter-chat-loading">
          <LoadingMoreIndicator text={t('common.loading')} />
        </div>
      </div>
    )
  }

  return (
    <div className="alter-chat-container">
      <div className="alter-chat">
        <div className="alter-chat-header">
          <div className="alter-chat-header-top">
            <div className="alter-chat-header-info">
              <div className="alter-chat-avatar">
                <Logo variant="icon" size={28} />
              </div>
              <div>
                <h2 className="alter-chat-title">{t('chat.alterAgent')}</h2>
                <p className="alter-chat-subtitle">{t('chat.online')}</p>
              </div>
            </div>
            <div className="alter-chat-header-actions">
              {profileState && (
                <button
                  className="alter-chat-profile-compact"
                  onClick={() => setShowProfileDetails(!showProfileDetails)}
                  title={t('common.viewProfileDetails')}
                >
                  <svg className="alter-chat-profile-ring" viewBox="0 0 36 36">
                    <defs>
                      <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'var(--color-primary-500)', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: 'var(--color-secondary-500)', stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    <circle
                      className="alter-chat-profile-ring-bg"
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      strokeWidth="3"
                    />
                    <circle
                      className="alter-chat-profile-ring-progress"
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      strokeWidth="3"
                      strokeDasharray={`${(profileState.completion || 0) * 1.005}, 100.5`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="alter-chat-profile-compact-percent">{profileState.completion || 0}%</span>
                </button>
              )}
              <div className="alter-chat-header-share">
                <ShareButton variant="ghost" size="sm" />
              </div>
              <div className="alter-chat-intention-selector" ref={intentionMenuRef}>
                <button
                  className="alter-chat-intention-button"
                  onClick={() => setShowIntentionMenu(!showIntentionMenu)}
                >
                  <span className="alter-chat-intention-current-icon">{getIntentionIcon(intention)}</span>
                  <span className="alter-chat-intention-chevron">▼</span>
                </button>
                {showIntentionMenu && (
                  <div className="alter-chat-intention-menu">
                    {(['personality', 'friendship', 'love', 'carnal'] as const).map((key) => (
                      <button
                        key={key}
                        className={`alter-chat-intention-menu-item ${intention === key ? 'alter-chat-intention-menu-item--active' : ''}`}
                        onClick={() => handleIntentionChange(key)}
                      >
                        <span className="alter-chat-intention-menu-icon">{getIntentionIcon(key)}</span>
                        <span>{getIntentionLabel(key)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal détails profil */}
        {showProfileDetails && profileState && (
          <div className="alter-chat-profile-modal-overlay" onClick={() => setShowProfileDetails(false)}>
            <div className="alter-chat-profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="alter-chat-profile-modal-header">
                <h3 className="alter-chat-profile-modal-title">Votre Profil ALTER</h3>
                <button
                  className="alter-chat-profile-modal-close"
                  onClick={() => setShowProfileDetails(false)}
                >
                  ×
                </button>
              </div>
              <div className="alter-chat-profile-modal-content">
                <div className="alter-chat-profile-completion">
                  <div className="alter-chat-profile-completion-label">
                    <span>Complétion du profil</span>
                    <span className="alter-chat-profile-completion-percent">{profileState.completion || 0}%</span>
                  </div>
                  <div className="alter-chat-profile-completion-bar">
                    <div
                      className="alter-chat-profile-completion-fill"
                      style={{ width: `${profileState.completion || 0}%` }}
                    />
                  </div>
                </div>
                {profileState.bio && (
                  <div className="alter-chat-profile-bio">
                    <span className="alter-chat-profile-bio-icon">✨</span>
                    <span className="alter-chat-profile-bio-text">{profileState.bio}</span>
                  </div>
                )}
                {profileState.interests && profileState.interests.length > 0 && (
                  <div className="alter-chat-profile-interests">
                    <div className="alter-chat-profile-interests-header">
                      <span className="alter-chat-profile-interests-icon">🎯</span>
                      <span className="alter-chat-profile-interests-title">Centres d'intérêt</span>
                    </div>
                    <div className="alter-chat-profile-interests-list">
                      {profileState.interests.map((interest: string, index: number) => (
                        <span key={index} className="alter-chat-profile-interest-tag">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="alter-chat-messages" ref={messagesContainerRef}>
          {isLoadingMore && (
            <LoadingMoreIndicator text={t('chat.loadingMore')} />
          )}
          {messages.map((message, index) => {
            // Vérifier si cette question a déjà été répondue
            const hasBeenAnswered = message.role === 'assistant' &&
              message.options &&
              message.options.length > 0 &&
              messages.slice(index + 1).some(m => m.role === 'user')

            return (
              <div
                key={message.id}
                className={`alter-chat-message alter-chat-message--${message.role}`}
              >
                {message.role === 'assistant' && (
                  <div className="alter-chat-message-avatar">
                    <Logo variant="icon" size={20} />
                  </div>
                )}
                <div className="alter-chat-message-content">
                  {message.structuredData?.question_number && message.structuredData.question_number !== '0/0' && (
                    <div className="alter-chat-question-number">
                      <span className="alter-chat-question-number-badge">
                        {t('chat.question')} {message.structuredData.question_number}
                        {message.structuredData?.step && ` - ${message.structuredData.step}`}
                      </span>
                    </div>
                  )}
                  <div className="alter-chat-message-text">
                    {parseMarkdown(message.content)}
                    {message.role === 'assistant' && message.structuredData?.question && (
                      <>
                        <br />
                        <strong>{message.structuredData.question}</strong>
                      </>
                    )}
                  </div>
                  <div className="alter-chat-message-time">{formatMessageTime(message.timestamp)}</div>
                  {message.selectionType === 'freetext' && !hasBeenAnswered && (
                    <div className="alter-chat-options-instruction">
                      <span className="alter-chat-options-instruction-icon">✍️</span>
                      <span>{t('chat.freetextResponse')}</span>
                    </div>
                  )}
                  {message.options && message.options.length > 0 && message.selectionType !== 'freetext' && !hasBeenAnswered && (
                    <>
                      <div className="alter-chat-options-instruction">
                        {message.selectionType === 'multiple' ? (
                          <>
                            <span className="alter-chat-options-instruction-icon">☑️</span>
                            <span>{t('chat.selectMultiple')}</span>
                          </>
                        ) : (
                          <>
                            <span className="alter-chat-options-instruction-icon">◉</span>
                            <span>{t('chat.selectOne')}</span>
                          </>
                        )}
                      </div>
                      <div className="alter-chat-options">
                        {message.options.map((option, optionIndex) => {
                          const isSelected = selectedOptions[message.id]?.includes(option)
                          return (
                            <button
                              key={optionIndex}
                              className={`alter-chat-option ${isSelected ? 'alter-chat-option--selected' : ''}`}
                              onClick={() => handleOptionClick(option, message.id, message.selectionType)}
                              disabled={isSending}
                            >
                              <span className="alter-chat-option-icon">
                                {message.selectionType === 'multiple'
                                  ? (isSelected ? '☑' : '☐')
                                  : (isSelected ? '◉' : '○')}
                              </span>
                              <span className="alter-chat-option-text">{option}</span>
                            </button>
                          )
                        })}
                        {message.selectionType === 'multiple' && (
                          <button
                            className="alter-chat-validate-button"
                            onClick={() => handleSendOptions(selectedOptions[message.id], message.id)}
                            disabled={isSending || !selectedOptions[message.id]?.length}
                          >
                            <span>{t('chat.validateSelection')}</span>
                            <span className="alter-chat-validate-icon">✓</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
          {isSending && (
            <div className="alter-chat-message alter-chat-message--assistant">
              <div className="alter-chat-message-avatar">
                <Logo variant="icon" size={20} />
              </div>
              <div className="alter-chat-typing">
                <div className="alter-chat-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="alter-chat-typing-text">{t('chat.typing')}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button
            className="alter-chat-scroll-to-bottom"
            onClick={scrollToBottom}
            title={t('common.scrollToBottom')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <div className="alter-chat-input">
          <textarea
            ref={textareaRef}
            className="alter-chat-textarea"
            placeholder={t('chat.typeMessage')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isSending}
            rows={1}
          />
          <button
            className="alter-chat-send-button"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
          >
            {isSending ? '⋯' : '➤'}
          </button>
        </div>
      </div>
    </div>
  )
}