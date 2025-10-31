import { api } from './api'
import { Message, ChatMessage, PhotoViewMode } from '@/types'
import { io, Socket } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:3000'
console.log('🔍 WebSocket API_BASE_URL:', API_BASE_URL)

// WebSocket pour le chat entre utilisateurs
let chatSocket: Socket | null = null

// WebSocket pour Alter Chat
let alterChatSocket: Socket | null = null

export const chatService = {
  // ===== Chat entre utilisateurs (WebSocket) =====

  initChatSocket(): Socket {
    if (!chatSocket) {
      chatSocket = io(`${API_BASE_URL}/chat`, {
        transports: ['websocket'],
        auth: {
          token: localStorage.getItem('auth_token'),
        },
      })
    }
    return chatSocket
  },

  joinMatch(matchId: string) {
    if (chatSocket) {
      chatSocket.emit('join-match', matchId)
    }
  },

  sendMessageWS(matchId: string, receiverId: string, content: string) {
    if (chatSocket) {
      chatSocket.emit('send-message', { matchId, receiverId, content })
    }
  },

  onMessage(callback: (message: Message) => void) {
    if (chatSocket) {
      chatSocket.on('message', callback)
    }
  },

  // Événement typing
  sendTyping(matchId: string, isTyping: boolean) {
    if (chatSocket) {
      chatSocket.emit('typing', { matchId, isTyping })
    }
  },

  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    if (chatSocket) {
      chatSocket.on('user-typing', callback)
    }
  },

  // Événement média rejeté
  onMediaRejected(callback: (data: { mediaId: string; matchId: string; rejectedBy: string }) => void) {
    if (chatSocket) {
      chatSocket.on('media:rejected', callback)
    }
  },

  // Événement message livré
  sendMessageDelivered(matchId: string, messageId: string) {
    if (chatSocket) {
      chatSocket.emit('message-delivered', { matchId, messageId })
    }
  },

  onMessageDelivered(callback: (data: { messageId: string; deliveredTo: string }) => void) {
    if (chatSocket) {
      chatSocket.on('message:delivered', callback)
    }
  },

  // Événement message lu
  sendMessageRead(matchId: string, messageId: string) {
    if (chatSocket) {
      chatSocket.emit('message-read', { matchId, messageId })
    }
  },

  onMessageRead(callback: (data: { matchId: string; readBy: string }) => void) {
    if (chatSocket) {
      chatSocket.on('message:read', callback)
    }
  },

  disconnectChat() {
    if (chatSocket) {
      chatSocket.disconnect()
      chatSocket = null
    }
  },

  async getMatchMessages(matchId: string, limit?: number, before?: string): Promise<Message[]> {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (before) params.append('before', before)

    const queryString = params.toString()
    const url = `/chat/matches/${matchId}/messages${queryString ? `?${queryString}` : ''}`

    return api.get<Message[]>(url)
  },

  async sendMessage(matchId: string, content: string): Promise<Message> {
    return api.post<Message>(`/chat/matches/${matchId}/messages`, { content })
  },

  async markAsRead(matchId: string): Promise<void> {
    return api.post(`/chat/matches/${matchId}/read`)
  },

  /**
   * Envoie un message vocal
   */
  async sendVoiceMessage(matchId: string, audioBlob: Blob, duration: number): Promise<Message> {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'voice.webm')
    formData.append('duration', duration.toString())

    const response = await fetch(`${API_BASE_URL}/api/chat/matches/${matchId}/voice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to send voice message')
    }

    return response.json()
  },

  /**
   * Envoie une photo
   */
  async sendPhotoMessage(
    matchId: string,
    photoBlob: Blob,
    options: {
      isReel: boolean
      viewMode: PhotoViewMode
      viewDuration?: number
    }
  ): Promise<Message> {
    const formData = new FormData()
    formData.append('photo', photoBlob, 'photo.jpg')
    formData.append('isReel', options.isReel.toString())
    formData.append('viewMode', options.viewMode)
    if (options.viewDuration) {
      formData.append('viewDuration', options.viewDuration.toString())
    }

    const response = await fetch(`${API_BASE_URL}/api/chat/matches/${matchId}/photo`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Failed to send photo message')
    }

    return response.json()
  },

  /**
   * Marque une photo comme vue
   */
  async markPhotoAsViewed(matchId: string, mediaId: string): Promise<void> {
    return api.post(`/chat/matches/${matchId}/media/${mediaId}/view`)
  },

  /**
   * Accepte une photo avec contenu sensible
   */
  async acceptMedia(matchId: string, mediaId: string): Promise<void> {
    return api.post(`/chat/matches/${matchId}/media/${mediaId}/accept`)
  },

  /**
   * Rejette une photo avec contenu sensible
   */
  async rejectMedia(matchId: string, mediaId: string): Promise<void> {
    return api.post(`/chat/matches/${matchId}/media/${mediaId}/reject`)
  },

  /**
   * Analyse la qualité de la conversation
   */
  async analyzeConversationQuality(matchId: string): Promise<{
    overallScore: number
    respect: number
    engagement: number
    depth: number
    positivity: number
    analysis: string
  }> {
    return api.get(`/chat/matches/${matchId}/quality`)
  },

  // ===== Alter Chat (WebSocket) =====

  initAlterChatSocket(): Socket {
    if (!alterChatSocket) {
      alterChatSocket = io(`${API_BASE_URL}/alter-chat`, {
        transports: ['websocket'],
        auth: {
          token: localStorage.getItem('auth_token'),
        },
      })

      // Rejoindre automatiquement la room Alter Chat (userId extrait du JWT côté serveur)
      alterChatSocket.on('connect', () => {
        alterChatSocket?.emit('join-alter-chat')
      })
    }
    return alterChatSocket
  },

  async loadAlterHistory(limit?: number, before?: string): Promise<ChatMessage[]> {
    return new Promise((resolve) => {
      if (alterChatSocket) {
        alterChatSocket.emit('load-alter-history', { limit, before })
        alterChatSocket.once('alter-history', (messages: ChatMessage[]) => {
          resolve(messages)
        })
      } else {
        resolve([])
      }
    })
  },

  sendAlterMessage(content: string) {
    if (alterChatSocket) {
      alterChatSocket.emit('send-alter-message', { content })
    }
  },

  onAlterMessage(callback: (message: ChatMessage) => void) {
    if (alterChatSocket) {
      alterChatSocket.on('alter-message', callback)
    }
  },

  disconnectAlterChat() {
    if (alterChatSocket) {
      alterChatSocket.disconnect()
      alterChatSocket = null
    }
  },

  // Fallback HTTP (si nécessaire)
  async getAiMessages(): Promise<ChatMessage[]> {
    return api.get<ChatMessage[]>('/chat/ai/messages')
  },

  /**
   * Génère un message de partage personnalisé pour les réseaux sociaux
   */
  async generateShareMessage(): Promise<{ message: string }> {
    return api.get<{ message: string }>('/chat/ai/share-message')
  },
}