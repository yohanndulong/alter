import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { chatService } from '@/services/chat'
import { matchingService } from '@/services/matching'
import { Message } from '@/types'
import { useAuth } from './AuthContext'
import { alterDB } from '@/utils/indexedDB'

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
    const handleNewMessage = async (message: Message) => {
      // Si le message est envoyé par quelqu'un d'autre, incrémenter le compteur
      if (message.senderId !== user.id) {
        // Incrémenter le compteur local
        incrementUnread(message.matchId)

        // Mettre à jour le cache IndexedDB
        await alterDB.updateMatchUnreadCount(message.matchId, 1)

        // Mettre à jour le dernier message dans le cache
        if (message.content) {
          await alterDB.updateMatchLastMessage(
            message.matchId,
            message.content,
            new Date(message.createdAt)
          )
        }

        // Note: Pas besoin de recharger loadUnreadCount car on met à jour le state directement
        // Cela évite des appels API inutiles à /matching/matches
      }
    }

    // Écouter quand des messages sont marqués comme lus
    const handleMessageRead = async (data: { matchId: string; readBy: string }) => {
      // Si c'est nous qui lisons, réinitialiser le compteur pour ce match
      if (data.readBy === user.id) {
        resetUnread(data.matchId)

        // Mettre à jour le cache IndexedDB (reset à 0)
        await alterDB.updateMatch(data.matchId, { unreadCount: 0 })
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
