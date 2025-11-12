import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/services/chat'
import { Message } from '@/types'
import { useAuth } from './AuthContext'
import { alterDB } from '@/utils/indexedDB'
import { chatKeys, matchingKeys } from '@/hooks'

interface WebSocketContextType {
  isConnected: boolean
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

interface WebSocketProviderProps {
  children: ReactNode
}

/**
 * WebSocketProvider - Connexion WebSocket globale et permanente
 *
 * Initialise la connexion WebSocket dès le login et la maintient active
 * pendant toute la session. Met à jour automatiquement :
 * - Le cache React Query
 * - Le cache IndexedDB
 * - L'UI en temps réel
 *
 * Même si l'utilisateur n'est pas sur la page Chat, les messages sont
 * reçus et mis en cache (comme WhatsApp).
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const isConnectedRef = useRef(false)

  useEffect(() => {
    if (!user?.id || isConnectedRef.current) return

    console.log('🔌 Initializing global WebSocket connections...')

    // Initialiser les WebSockets (Chat et Alter Chat)
    chatService.initChatSocket()
    chatService.initAlterChatSocket()
    isConnectedRef.current = true

    // ========================================
    // Handler pour les nouveaux messages (avec cursor-based sync)
    // ========================================
    const handleNewMessage = async (message: Message) => {
      console.log('📨 WebSocket: New message received', {
        id: message.id,
        sequenceId: message.sequenceId,
        matchId: message.matchId,
        senderId: message.senderId,
        content: message.content?.substring(0, 50),
        isOwnMessage: message.senderId === user.id,
      })

      // 1. Deduplication basée sur sequenceId
      const currentCursor = await alterDB.getLastSequenceId(message.matchId)
      if (currentCursor !== null && message.sequenceId <= currentCursor) {
        console.log('⚠️ WebSocket: Duplicate message detected (seq <= cursor), ignoring', {
          messageSeq: message.sequenceId,
          cursor: currentCursor
        })
        return
      }

      // 2. Sauvegarder le message dans IndexedDB
      await alterDB.addMessage(message.matchId, message)

      // 3. Mettre à jour le cursor
      await alterDB.setLastSequenceId(message.matchId, message.sequenceId)
      console.log(`✅ WebSocket: Updated cursor to ${message.sequenceId}`)

      // 4. Mettre à jour le cache React Query des messages
      const result = queryClient.setQueryData<Message[]>(
        chatKeys.messages(message.matchId),
        (old = []) => {
          // Double-check: éviter les doublons par sequenceId ou id
          const exists = old.some(m => m.sequenceId === message.sequenceId || m.id === message.id)
          if (exists) {
            console.log('⚠️ WebSocket: Message already exists in React Query cache, ignoring', message.id)
            return old
          }

          // Si c'est notre propre message, supprimer TOUS les messages optimistes (sequenceId <= 0)
          // Cela évite les doublons pour tous les types de messages (text, photo, vocal)
          if (message.senderId === user.id) {
            const filtered = old.filter(m => m.sequenceId > 0)
            const removedCount = old.length - filtered.length

            if (removedCount > 0) {
              console.log('📝 WebSocket: Replacing optimistic message(s)', {
                removed: removedCount,
                total: filtered.length + 1,
                messageType: message.type,
                messageSenderId: message.senderId,
                contextUserId: user.id,
              })
            } else {
              console.log('⚠️ WebSocket: No optimistic message to replace', {
                messageType: message.type,
                oldMessagesCount: old.length,
                oldMessagesWithNegativeSeq: old.filter(m => m.sequenceId <= 0).length,
              })
            }

            return [...filtered, message]
          }

          console.log('➕ WebSocket: Adding new message to cache', {
            from: old.length,
            to: old.length + 1
          })
          return [...old, message]
        }
      )

      console.log('💾 WebSocket: Cache updated, total messages:', result?.length || 0)

      // Sauvegarder dans IndexedDB (après suppression des optimistes)
      if (result && result.length > 0) {
        await alterDB.saveMessages(message.matchId, result)
        console.log(`💾 WebSocket: Saved ${result.length} messages to IndexedDB (optimistic removed)`)
      }

      // 3. Mettre à jour le cache des matches (lastMessage, unreadCount) sans refetch
      if (message.senderId !== user.id) {
        // Incrémenter unreadCount seulement si ce n'est pas notre message
        await alterDB.updateMatchUnreadCount(message.matchId, 1)
      }

      if (message.content) {
        await alterDB.updateMatchLastMessage(
          message.matchId,
          message.content,
          new Date(message.createdAt)
        )
      }

      // 4. Mettre à jour le cache des matches directement (sans refetch = pas de rechargement d'images)
      queryClient.setQueryData<any[]>(
        matchingKeys.matches(),
        (oldMatches = []) => {
          return oldMatches.map(match => {
            if (match.id === message.matchId) {
              return {
                ...match,
                lastMessage: message.content || match.lastMessage,
                lastMessageAt: message.createdAt,
                unreadCount: message.senderId !== user.id
                  ? (match.unreadCount || 0) + 1
                  : match.unreadCount,
              }
            }
            return match
          })
        }
      )

      console.log('✅ WebSocket: Message processed and cached')
    }

    // ========================================
    // Handler pour typing indicator
    // ========================================
    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      console.log('⌨️ WebSocket: User typing', data)
      // L'UI individuelle gérera l'affichage via son propre listener
    }

    // ========================================
    // Handler pour message delivered
    // ========================================
    const handleMessageDelivered = async (data: { messageId: string; deliveredTo: string }) => {
      console.log('✓ WebSocket: Message delivered', data)
      // TODO: Backend devrait envoyer matchId
      // Pour l'instant, l'UI locale gère l'affichage via son propre listener
    }

    // ========================================
    // Handler pour message read
    // ========================================
    const handleMessageRead = async (data: { matchId: string; readBy: string }) => {
      console.log('✓✓ WebSocket: Messages read', data)

      // Si c'est nous qui lisons, reset unreadCount
      if (data.readBy === user.id) {
        await alterDB.updateMatch(data.matchId, { unreadCount: 0 })

        // Mettre à jour le cache directement sans refetch
        queryClient.setQueryData<any[]>(
          matchingKeys.matches(),
          (oldMatches = []) => {
            return oldMatches.map(match => {
              if (match.id === data.matchId) {
                return {
                  ...match,
                  unreadCount: 0,
                }
              }
              return match
            })
          }
        )
      } else {
        // L'autre personne a lu nos messages
        queryClient.setQueryData<Message[]>(
          chatKeys.messages(data.matchId),
          (old = []) => old.map(msg =>
            msg.senderId === user.id
              ? { ...msg, read: true, readAt: new Date() }
              : msg
          )
        )
      }
    }

    // ========================================
    // Handler pour media rejected
    // ========================================
    const handleMediaRejected = async (data: { mediaId: string; matchId: string; rejectedBy: string }) => {
      console.log('❌ WebSocket: Media rejected by', data.rejectedBy)

      // Mettre à jour le message dans le cache React Query
      queryClient.setQueryData<Message[]>(
        chatKeys.messages(data.matchId),
        (old = []) => old.map(msg => {
          // Trouver le message avec ce media
          if (msg.media?.id === data.mediaId) {
            const updatedMsg = {
              ...msg,
              media: {
                ...msg.media,
                receiverStatus: 'rejected' as const,
                receiverDecisionAt: new Date(),
              },
            }

            // Mettre à jour IndexedDB pour persister le changement
            alterDB.addMessage(data.matchId, updatedMsg).catch(err => {
              console.error('Failed to update message in IndexedDB:', err)
            })

            return updatedMsg
          }
          return msg
        })
      )

      console.log('✅ WebSocket: Media marked as rejected in cache and IndexedDB')
    }

    // ========================================
    // Handler pour media accepted
    // ========================================
    const handleMediaAccepted = async (data: { mediaId: string; matchId: string; acceptedBy: string }) => {
      console.log('✅ WebSocket: Media accepted by', data.acceptedBy)

      // Mettre à jour le message dans le cache React Query
      queryClient.setQueryData<Message[]>(
        chatKeys.messages(data.matchId),
        (old = []) => old.map(msg => {
          // Trouver le message avec ce media
          if (msg.media?.id === data.mediaId) {
            const updatedMsg = {
              ...msg,
              media: {
                ...msg.media,
                receiverStatus: 'accepted' as const,
                receiverDecisionAt: new Date(),
              },
            }

            // Mettre à jour IndexedDB pour persister le changement
            alterDB.addMessage(data.matchId, updatedMsg).catch(err => {
              console.error('Failed to update message in IndexedDB:', err)
            })

            return updatedMsg
          }
          return msg
        })
      )

      console.log('✅ WebSocket: Media marked as accepted in cache and IndexedDB')
    }

    // ========================================
    // Handler pour photo ready (analyse NSFW terminée)
    // ========================================
    const handlePhotoReady = (data: {
      mediaId: string
      matchId: string
      processingStatus: 'completed' | 'failed'
      receiverStatus: 'pending' | 'accepted' | 'rejected'
      moderationResult?: {
        isSafe: boolean
        pornScore?: number
        sexyScore?: number
        hentaiScore?: number
        neutralScore?: number
        warnings?: string[]
      }
      moderationWarnings: string[]
      url: string
    }) => {
      console.log('📸 WebSocket: Photo ready', data)

      // Mettre à jour le message dans le cache React Query
      queryClient.setQueryData<Message[]>(
        chatKeys.messages(data.matchId),
        (old = []) => old.map(msg => {
          // Trouver le message avec ce media
          if (msg.media?.id === data.mediaId) {
            return {
              ...msg,
              media: {
                ...msg.media,
                processingStatus: data.processingStatus,
                receiverStatus: data.receiverStatus,
                moderationResult: data.moderationResult, // Inclure le résultat complet de modération
                moderationWarnings: data.moderationWarnings,
                url: data.url,
              },
            }
          }
          return msg
        })
      )

      console.log('✅ WebSocket: Photo updated in cache')
    }

    // ========================================
    // Handler pour les nouveaux matches (si le backend l'implémente)
    // ========================================
    // const handleNewMatch = async (match: Match) => {
    //   console.log('💕 WebSocket: New match!', match)
    //   const currentMatches = await alterDB.loadMatches() || []
    //   await alterDB.saveMatches([match, ...currentMatches])
    //   queryClient.invalidateQueries({ queryKey: matchingKeys.matches() })
    // }

    // Enregistrer tous les listeners
    chatService.onMessage(handleNewMessage)
    chatService.onTyping(handleTyping)
    chatService.onMessageDelivered(handleMessageDelivered)
    chatService.onMessageRead(handleMessageRead)
    chatService.onMediaRejected(handleMediaRejected)

    // Écouter les événements photo:ready et media:accepted
    const socket = chatService.initChatSocket()
    if (socket) {
      socket.on('photo:ready', handlePhotoReady)
      socket.on('media:accepted', handleMediaAccepted)
    }

    console.log('✅ Global WebSocket connection established')

    // Cleanup : NE PAS déconnecter les sockets !
    // On garde les connexions actives pendant toute la session
    return () => {
      console.log('⚠️ WebSocketProvider unmounting (logout)')
      // Ne déconnecter que si l'utilisateur se déconnecte
      if (!user) {
        chatService.disconnectChat()
        chatService.disconnectAlterChat()
        isConnectedRef.current = false
      }
    }
  }, [user?.id, queryClient])

  const value: WebSocketContextType = {
    isConnected: isConnectedRef.current,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
