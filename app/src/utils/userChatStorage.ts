import { Message } from '@/types'
import { secureStorage } from './secureStorage'

const STORAGE_PREFIX = 'user_chat_messages_'
const MAX_STORED_MESSAGES = 500 // Limite par conversation

/**
 * Utility for managing user chat messages in secure storage
 * Each match has its own storage key
 * Uses Capacitor Preferences (Keychain/KeyStore) on mobile, localStorage on web
 */
export const userChatStorage = {
  /**
   * Get the storage key for a specific match
   */
  getStorageKey(matchId: string): string {
    return `${STORAGE_PREFIX}${matchId}`
  },

  /**
   * Save messages for a specific match to secure storage
   */
  async saveMessages(matchId: string, messages: Message[]): Promise<void> {
    try {
      // Garder seulement les MAX_STORED_MESSAGES messages les plus récents
      const messagesToStore = messages.slice(-MAX_STORED_MESSAGES)
      const key = this.getStorageKey(matchId)
      await secureStorage.setItem(key, JSON.stringify(messagesToStore))
    } catch (error) {
      console.error('Failed to save messages to secure storage:', error)
      // Si le stockage est plein, essayer de vider et réessayer
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          const key = this.getStorageKey(matchId)
          await secureStorage.removeItem(key)
          const messagesToStore = messages.slice(-MAX_STORED_MESSAGES / 2)
          await secureStorage.setItem(key, JSON.stringify(messagesToStore))
        } catch (retryError) {
          console.error('Failed to save messages after clearing:', retryError)
        }
      }
    }
  },

  /**
   * Load messages for a specific match from secure storage
   */
  async loadMessages(matchId: string): Promise<Message[]> {
    try {
      const key = this.getStorageKey(matchId)
      const stored = await secureStorage.getItem(key)
      if (!stored) return []

      const messages = JSON.parse(stored) as Message[]
      // Convertir les timestamps en objets Date
      return messages.map(msg => ({
        ...msg,
        createdAt: new Date(msg.createdAt)
      }))
    } catch (error) {
      console.error('Failed to load messages from secure storage:', error)
      return []
    }
  },

  /**
   * Add a new message to the stored messages
   */
  async addMessage(matchId: string, message: Message): Promise<void> {
    const messages = await this.loadMessages(matchId)
    messages.push(message)
    await this.saveMessages(matchId, messages)
  },

  /**
   * Add multiple messages to the stored messages
   */
  async addMessages(matchId: string, newMessages: Message[]): Promise<void> {
    const messages = await this.loadMessages(matchId)
    messages.push(...newMessages)
    await this.saveMessages(matchId, messages)
  },

  /**
   * Update an existing message in storage
   */
  async updateMessage(matchId: string, messageId: string, updates: Partial<Message>): Promise<void> {
    const messages = await this.loadMessages(matchId)
    const updatedMessages = messages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    )
    await this.saveMessages(matchId, updatedMessages)
  },

  /**
   * Clear stored messages for a specific match
   */
  async clearMessages(matchId: string): Promise<void> {
    try {
      const key = this.getStorageKey(matchId)
      await secureStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to clear messages from secure storage:', error)
    }
  },

  /**
   * Clear all stored user chat messages
   */
  async clearAllMessages(): Promise<void> {
    try {
      const keys = await secureStorage.keys()
      const keysToRemove = keys.filter(key => key.startsWith(STORAGE_PREFIX))
      for (const key of keysToRemove) {
        await secureStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Failed to clear all messages from secure storage:', error)
    }
  },

  /**
   * Get the ID of the oldest stored message
   */
  async getOldestMessageId(matchId: string): Promise<string | null> {
    const messages = await this.loadMessages(matchId)
    return messages.length > 0 ? messages[0].id : null
  },

  /**
   * Get the ID of the newest stored message
   */
  async getNewestMessageId(matchId: string): Promise<string | null> {
    const messages = await this.loadMessages(matchId)
    return messages.length > 0 ? messages[messages.length - 1].id : null
  }
}
