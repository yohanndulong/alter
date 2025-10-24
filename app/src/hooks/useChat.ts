import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { chatService } from '@/services/chat'
import { Message, ChatMessage } from '@/types'
import { userChatStorage } from '@/utils/userChatStorage'
import { alterChatStorage } from '@/utils/alterChatStorage'

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
 * Charge d'abord depuis le cache local (userChatStorage) pour affichage instantané
 * Puis fetch depuis le serveur en arrière-plan
 * WebSocket gère les mises à jour en temps réel
 */
export function useMessages(matchId: string | undefined, limit?: number) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: chatKeys.messages(matchId || ''),
    queryFn: async () => {
      if (!matchId) return []

      // Charger depuis le serveur
      const serverMessages = await chatService.getMatchMessages(matchId, limit)

      // Sauvegarder dans le cache persistant
      await userChatStorage.saveMessages(matchId, serverMessages)

      return serverMessages
    },
    enabled: !!matchId,
    staleTime: 1 * 60 * 1000, // 1 minute (les messages changent vite)
    initialData: () => {
      // Données initiales depuis le cache local (synchrone, rapide)
      // Note: On ne peut pas utiliser async ici, donc on retourne undefined
      // et on charge le cache dans un useEffect séparé
      return undefined
    }
  })

  // Charger le cache local de manière asynchrone au premier rendu
  useEffect(() => {
    if (!matchId) return

    const loadCache = async () => {
      const cachedMessages = await userChatStorage.loadMessages(matchId)
      if (cachedMessages.length > 0) {
        // Pré-remplir le cache React Query avec les données locales
        queryClient.setQueryData<Message[]>(
          chatKeys.messages(matchId),
          cachedMessages
        )
      }
    }

    // Charger le cache uniquement si on n'a pas encore de données
    if (!query.data || query.data.length === 0) {
      loadCache()
    }
  }, [matchId, queryClient])

  return query
}

/**
 * Hook pour récupérer les messages Alter Chat
 * Charge d'abord depuis le cache local (alterChatStorage) pour affichage instantané
 * Puis fetch depuis le serveur en arrière-plan
 * WebSocket gère les mises à jour en temps réel
 */
export function useAlterMessages() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: chatKeys.alterMessages(),
    queryFn: async () => {
      // Charger depuis le serveur via WebSocket
      chatService.initAlterChatSocket()
      const serverMessages = await chatService.loadAlterHistory(50)

      // Sauvegarder dans le cache persistant
      await alterChatStorage.saveMessages(serverMessages)

      return serverMessages
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  // Charger le cache local de manière asynchrone au premier rendu
  useEffect(() => {
    const loadCache = async () => {
      const cachedMessages = await alterChatStorage.loadMessages()
      if (cachedMessages.length > 0) {
        // Pré-remplir le cache React Query avec les données locales
        queryClient.setQueryData<ChatMessage[]>(
          chatKeys.alterMessages(),
          cachedMessages
        )
      }
    }

    // Charger le cache uniquement si on n'a pas encore de données
    if (!query.data || query.data.length === 0) {
      loadCache()
    }
  }, [queryClient])

  return query
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
 * Sauvegarde aussi dans le cache persistant
 */
export function useAddMessageToCache() {
  const queryClient = useQueryClient()

  return async (matchId: string, message: Message) => {
    // Mettre à jour le cache React Query
    const updatedMessages = queryClient.setQueryData<Message[]>(
      chatKeys.messages(matchId),
      (old = []) => [...old, message]
    )

    // Sauvegarder dans le cache persistant
    if (updatedMessages) {
      await userChatStorage.saveMessages(matchId, updatedMessages)
    }
  }
}

/**
 * Helper pour ajouter un message Alter au cache
 * Sauvegarde aussi dans le cache persistant
 */
export function useAddAlterMessageToCache() {
  const queryClient = useQueryClient()

  return async (message: ChatMessage) => {
    // Mettre à jour le cache React Query
    queryClient.setQueryData<ChatMessage[]>(
      chatKeys.alterMessages(),
      (old = []) => [...old, message]
    )

    // Sauvegarder dans le cache persistant
    await alterChatStorage.addMessage(message)
  }
}
