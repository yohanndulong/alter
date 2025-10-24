import { useUnreadCountContext } from '@/contexts/UnreadCountContext'

/**
 * Hook pour obtenir le nombre total de messages non lus
 * Utilise le contexte UnreadCountContext pour des mises à jour en temps réel via WebSocket
 */
export const useUnreadCount = () => {
  return useUnreadCountContext()
}
