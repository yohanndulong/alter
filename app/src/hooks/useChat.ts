import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '@/services/chat'
import { Message, ChatMessage } from '@/types'
import { alterDB } from '@/utils/indexedDB'

/**
 * Query keys pour les hooks de chat
 */
export const chatKeys = {
  all: ['chat'] as const,
  messages: (matchId: string) => [...chatKeys.all, 'messages', matchId] as const,
  alterMessages: () => [...chatKeys.all, 'alter-messages'] as const,
}

/**
 * Hook pour récupérer les messages d'un match avec cursor-based sync
 *
 * Stratégie de synchronisation :
 * - Si pas de cursor (première visite) : charge tous les messages (snapshot)
 * - Si cursor existe : charge uniquement les nouveaux messages (incremental sync)
 * - Sauvegarde le cursor après chaque sync
 * - WebSocket gère les mises à jour en temps réel avec deduplication
 *
 * Avantages :
 * - Pas de race condition entre cache et serveur
 * - Pas de messages manquants après fermeture de l'app
 * - Synchronisation efficace (uniquement les nouveaux messages)
 */
export function useMessages(matchId: string | undefined) {
  const query = useQuery({
    queryKey: chatKeys.messages(matchId || ''),
    queryFn: async () => {
      if (!matchId) return []

      console.log(`🔄 [useMessages] Fetching messages for match ${matchId}`)

      // Récupérer le dernier sequenceId synchronisé
      const lastSeq = await alterDB.getLastSequenceId(matchId)

      if (lastSeq === null) {
        // Première synchronisation : charger tous les messages
        console.log(`📥 [useMessages] Initial snapshot for match ${matchId}`)
        const messages = await chatService.getMatchMessages(matchId, 100)

        // Sauvegarder dans IndexedDB
        await alterDB.saveMessages(matchId, messages)

        // Sauvegarder le cursor si on a des messages
        if (messages.length > 0) {
          const maxSeq = Math.max(...messages.map(m => m.sequenceId))
          await alterDB.setLastSequenceId(matchId, maxSeq)
          console.log(`✅ [useMessages] Saved cursor: ${maxSeq}`)
        }

        return messages
      } else {
        // Synchronisation incrémentale : charger uniquement les nouveaux messages
        console.log(`🔄 [useMessages] Incremental sync for match ${matchId} after seq ${lastSeq}`)
        const newMessages = await chatService.syncMessages(matchId, lastSeq)

        if (newMessages.length > 0) {
          // Charger les messages existants depuis IndexedDB
          const cachedMessages = await alterDB.loadMessages(matchId)

          // Fusionner avec les nouveaux messages
          const mergedMessages = [...cachedMessages, ...newMessages]

          // Sauvegarder dans IndexedDB
          await alterDB.saveMessages(matchId, mergedMessages)

          // Mettre à jour le cursor
          const maxSeq = Math.max(...newMessages.map(m => m.sequenceId))
          await alterDB.setLastSequenceId(matchId, maxSeq)
          console.log(`✅ [useMessages] Synced ${newMessages.length} new messages, cursor: ${maxSeq}`)

          return mergedMessages
        } else {
          // Pas de nouveaux messages, retourner le cache
          console.log(`✅ [useMessages] No new messages, returning cache`)
          return await alterDB.loadMessages(matchId)
        }
      }
    },
    enabled: !!matchId,
    staleTime: 0, // Toujours refetch pour détecter les nouveaux messages
    refetchOnMount: true, // Refetch à chaque montage pour récupérer les messages manqués
    refetchOnWindowFocus: true, // Refetch quand l'utilisateur revient sur l'app
  })

  return query
}

/**
 * Hook pour récupérer les messages Alter Chat
 * Charge les derniers messages depuis le serveur via WebSocket
 * Pas de cache persistant pour éviter les doublons
 */
export function useAlterMessages() {
  return useQuery({
    queryKey: chatKeys.alterMessages(),
    queryFn: async () => {
      // Charger les 50 derniers messages depuis le serveur
      const messages = await chatService.loadAlterHistory(50)
      return messages
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false, // Ne pas refetch à chaque mount pour éviter les doublons
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
 * Note: Le WebSocket gère automatiquement la mise à jour du cache,
 * donc pas besoin d'invalider ici
 */
export function useMarkAsRead(matchId: string) {
  return useMutation({
    mutationFn: () => chatService.markAsRead(matchId),
    onSuccess: () => {
      // Le WebSocket met à jour le cache automatiquement via handleMessageRead
      // Pas besoin d'invalider ici pour éviter les refetch inutiles
    },
  })
}

/**
 * Helper pour ajouter un message au cache sans refetch
 * Utilisé quand un message arrive via WebSocket
 * Implémente la deduplication basée sur sequenceId
 */
export function useAddMessageToCache() {
  const queryClient = useQueryClient()

  return async (matchId: string, message: Message) => {
    console.log(`📨 [useAddMessageToCache] Adding message ${message.id} (seq: ${message.sequenceId}) to cache`)

    // Mettre à jour le cache React Query avec deduplication
    const updatedMessages = queryClient.setQueryData<Message[]>(
      chatKeys.messages(matchId),
      (old = []) => {
        // Vérifier si le message existe déjà (par sequenceId > 0 ou par id)
        // Les messages optimistes (seq <= 0) ne sont jamais considérés comme doublons
        if (message.sequenceId > 0) {
          const exists = old.some(m => m.sequenceId === message.sequenceId || m.id === message.id)
          if (exists) {
            console.log(`⚠️ [useAddMessageToCache] Duplicate message detected, ignoring`)
            return old
          }
        }

        // Ajouter le nouveau message
        return [...old, message]
      }
    )

    // Sauvegarder dans IndexedDB
    if (updatedMessages) {
      await alterDB.saveMessages(matchId, updatedMessages)

      // Mettre à jour le cursor si c'est le message le plus récent
      const currentCursor = await alterDB.getLastSequenceId(matchId)
      if (currentCursor === null || message.sequenceId > currentCursor) {
        await alterDB.setLastSequenceId(matchId, message.sequenceId)
        console.log(`✅ [useAddMessageToCache] Updated cursor to ${message.sequenceId}`)
      }
    }
  }
}

/**
 * Helper pour ajouter un message Alter au cache React Query
 * Sans cache persistant pour éviter les doublons
 */
export function useAddAlterMessageToCache() {
  const queryClient = useQueryClient()

  return (message: ChatMessage) => {
    // Mettre à jour le cache React Query uniquement
    queryClient.setQueryData<ChatMessage[]>(
      chatKeys.alterMessages(),
      (old = []) => {
        // Éviter les doublons : vérifier si le message existe déjà
        const exists = old.some(m => m.id === message.id)
        if (exists) return old

        return [...old, message]
      }
    )
  }
}
