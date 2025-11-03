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

    console.log('🔌 Initializing global WebSocket connection...')

    // Initialiser le WebSocket
    chatService.initChatSocket()
    isConnectedRef.current = true

    // ========================================
    // Handler pour les nouveaux messages
    // ========================================
    const handleNewMessage = async (message: Message) => {
      console.log('📨 WebSocket: New message received', {
        matchId: message.matchId,
        senderId: message.senderId,
        isOwnMessage: message.senderId === user.id,
      })

      // 1. Sauvegarder le message dans IndexedDB
      await alterDB.addMessage(message.matchId, message)

      // 2. Mettre à jour le cache React Query des messages
      queryClient.setQueryData<Message[]>(
        chatKeys.messages(message.matchId),
        (old = []) => {
          // Éviter les doublons
          const exists = old.some(m => m.id === message.id)
          if (exists) return old

          // Si c'est notre propre message, supprimer l'optimistic update
          if (message.senderId === user.id) {
            const filtered = old.filter(
              m => !(m.id.startsWith('temp-') && m.content === message.content)
            )
            return [...filtered, message]
          }

          return [...old, message]
        }
      )

      // 3. Mettre à jour le cache des matches (lastMessage, unreadCount)
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

      // 4. Invalider le cache des matches pour forcer un refresh de la liste
      queryClient.invalidateQueries({ queryKey: matchingKeys.matches() })

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
        queryClient.invalidateQueries({ queryKey: matchingKeys.matches() })
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
    const handleMediaRejected = (data: { mediaId: string; matchId: string; rejectedBy: string }) => {
      console.log('❌ WebSocket: Media rejected', data)
      // Invalider les messages pour refresh
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(data.matchId) })
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

    console.log('✅ Global WebSocket connection established')

    // Cleanup : NE PAS déconnecter le socket !
    // On garde la connexion active pendant toute la session
    return () => {
      console.log('⚠️ WebSocketProvider unmounting (logout)')
      // Ne déconnecter que si l'utilisateur se déconnecte
      if (!user) {
        chatService.disconnectChat()
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
