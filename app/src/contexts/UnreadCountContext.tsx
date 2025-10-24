import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { chatService } from '@/services/chat'
import { matchingService } from '@/services/matching'
import { Message } from '@/types'
import { useAuth } from './AuthContext'

interface UnreadCountContextType {
  unreadCount: number
  isLoading: boolean
  refresh: () => Promise<void>
  incrementUnread: (matchId: string) => void
  decrementUnread: (matchId: string) => void
  resetUnread: (matchId: string) => void
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined)

export const useUnreadCountContext = () => {
  const context = useContext(UnreadCountContext)
  if (!context) {
    throw new Error('useUnreadCountContext must be used within UnreadCountProvider')
  }
  return context
}

interface UnreadCountProviderProps {
  children: ReactNode
}

export const UnreadCountProvider: React.FC<UnreadCountProviderProps> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [_unreadByMatch, setUnreadByMatch] = useState<Record<string, number>>({})
  const { user } = useAuth()

  // Charger le compteur initial
  const loadUnreadCount = async () => {
    try {
      const matches = await matchingService.getMatches()
      const unreadMap: Record<string, number> = {}
      let total = 0

      matches.forEach(match => {
        unreadMap[match.id] = match.unreadCount
        total += match.unreadCount
      })

      setUnreadByMatch(unreadMap)
      setUnreadCount(total)
    } catch (error) {
      console.error('Failed to load unread count:', error)
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Incrémenter le compteur pour un match spécifique
  const incrementUnread = (matchId: string) => {
    setUnreadByMatch(prev => {
      const newCount = (prev[matchId] || 0) + 1
      return { ...prev, [matchId]: newCount }
    })
    setUnreadCount(prev => prev + 1)
  }

  // Décrémenter le compteur pour un match spécifique
  const decrementUnread = (matchId: string) => {
    setUnreadByMatch(prev => {
      const currentCount = prev[matchId] || 0
      if (currentCount <= 0) return prev
      return { ...prev, [matchId]: currentCount - 1 }
    })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Réinitialiser le compteur pour un match spécifique
  const resetUnread = (matchId: string) => {
    setUnreadByMatch(prev => {
      const currentCount = prev[matchId] || 0
      const newMap = { ...prev, [matchId]: 0 }
      setUnreadCount(prevTotal => Math.max(0, prevTotal - currentCount))
      return newMap
    })
  }

  // Initialiser et écouter les événements WebSocket
  useEffect(() => {
    if (!user?.id) return

    // Charger le compteur initial
    loadUnreadCount()

    // Initialiser le WebSocket
    const socket = chatService.initChatSocket()

    // Écouter les nouveaux messages
    const handleNewMessage = (message: Message) => {
      // Si le message est envoyé par quelqu'un d'autre, incrémenter le compteur
      if (message.senderId !== user.id) {
        // Trouver le matchId à partir du message
        // Note: Le serveur devrait envoyer le matchId avec le message
        // Pour l'instant, on va incrémenter de manière générique
        setUnreadCount(prev => prev + 1)

        // Recharger le compteur pour avoir les données exactes
        setTimeout(() => loadUnreadCount(), 1000)
      }
    }

    // Écouter quand des messages sont marqués comme lus
    const handleMessageRead = (data: { matchId: string; readBy: string }) => {
      // Si c'est nous qui lisons, réinitialiser le compteur pour ce match
      if (data.readBy === user.id) {
        resetUnread(data.matchId)
      }
    }

    chatService.onMessage(handleNewMessage)
    chatService.onMessageRead(handleMessageRead)

    // Cleanup
    return () => {
      if (socket) {
        socket.off('message', handleNewMessage)
        socket.off('message:read', handleMessageRead)
      }
    }
  }, [user?.id])

  const value: UnreadCountContextType = {
    unreadCount,
    isLoading,
    refresh: loadUnreadCount,
    incrementUnread,
    decrementUnread,
    resetUnread
  }

  return (
    <UnreadCountContext.Provider value={value}>
      {children}
    </UnreadCountContext.Provider>
  )
}
