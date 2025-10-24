import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/services/chat'
import { Message, ChatMessage } from '@/types'

/**
 * Query keys pour les hooks de chat
 */
export const chatKeys = {
  all: ['chat'] as const,
  messages: (matchId: string) => [...chatKeys.all, 'messages', matchId] as const,
  alterMessages: () => [...chatKeys.all, 'alter-messages'] as const,
}

/**
 * Hook pour récupérer les messages d'un match
 * Utilisé pour charger l'historique initial
 * WebSocket gère les mises à jour en temps réel
 */
export function useMessages(matchId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: chatKeys.messages(matchId || ''),
    queryFn: () => {
      if (!matchId) return []
      return chatService.getMatchMessages(matchId, limit)
    },
    enabled: !!matchId,
    staleTime: 1 * 60 * 1000, // 1 minute (les messages changent vite)
  })
}

/**
 * Hook pour récupérer les messages Alter Chat
 * Charge l'historique initial via WebSocket
 * WebSocket gère les mises à jour en temps réel
 */
export function useAlterMessages() {
  return useQuery({
    queryKey: chatKeys.alterMessages(),
    queryFn: async () => {
      // Charger via WebSocket
      const socket = chatService.initAlterChatSocket()
      return chatService.loadAlterHistory(50)
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook pour envoyer un message
 * Invalide automatiquement le cache des messages
 */
export function useSendMessage(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => chatService.sendMessage(matchId, content),
    onSuccess: () => {
      // Invalider le cache pour rafraîchir les messages
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(matchId) })
    },
  })
}

/**
 * Hook pour marquer les messages comme lus
 */
export function useMarkAsRead(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => chatService.markAsRead(matchId),
    onSuccess: () => {
      // Invalider le cache des matches pour mettre à jour unreadCount
      queryClient.invalidateQueries({ queryKey: ['matching', 'matches'] })
    },
  })
}

/**
 * Helper pour ajouter un message au cache sans refetch
 * Utilisé quand un message arrive via WebSocket
 */
export function useAddMessageToCache() {
  const queryClient = useQueryClient()

  return (matchId: string, message: Message) => {
    queryClient.setQueryData<Message[]>(
      chatKeys.messages(matchId),
      (old = []) => [...old, message]
    )
  }
}

/**
 * Helper pour ajouter un message Alter au cache
 */
export function useAddAlterMessageToCache() {
  const queryClient = useQueryClient()

  return (message: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(
      chatKeys.alterMessages(),
      (old = []) => [...old, message]
    )
  }
}
