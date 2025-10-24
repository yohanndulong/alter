import { ChatMessage } from '@/types'
import { secureStorage } from './secureStorage'

const STORAGE_KEY = 'alter_chat_messages'
const MAX_STORED_MESSAGES = 500 // Limite pour éviter de surcharger le stockage

/**
 * Utility for managing Alter Chat messages in secure storage
 * Uses Capacitor Preferences (Keychain/KeyStore) on mobile, localStorage on web
 */
export const alterChatStorage = {
  /**
   * Save messages to secure storage
   */
  async saveMessages(messages: ChatMessage[]): Promise<void> {
    try {
      // Garder seulement les MAX_STORED_MESSAGES messages les plus récents
      const messagesToStore = messages.slice(-MAX_STORED_MESSAGES)
      await secureStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToStore))
    } catch (error) {
      console.error('Failed to save messages to secure storage:', error)
      // Si le stockage est plein, essayer de vider et réessayer
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          await secureStorage.removeItem(STORAGE_KEY)
          const messagesToStore = messages.slice(-MAX_STORED_MESSAGES / 2)
          await secureStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToStore))
        } catch (retryError) {
          console.error('Failed to save messages after clearing:', retryError)
        }
      }
    }
  },

  /**
   * Load messages from secure storage
   */
  async loadMessages(): Promise<ChatMessage[]> {
    try {
      const stored = await secureStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const messages = JSON.parse(stored) as ChatMessage[]
      // Convertir les timestamps en objets Date
      return messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    } catch (error) {
      console.error('Failed to load messages from secure storage:', error)
      return []
    }
  },

  /**
   * Add a new message to the stored messages
   */
  async addMessage(message: ChatMessage): Promise<void> {
    const messages = await this.loadMessages()
    messages.push(message)
    await this.saveMessages(messages)
  },

  /**
   * Add multiple messages to the stored messages
   */
  async addMessages(newMessages: ChatMessage[]): Promise<void> {
    const messages = await this.loadMessages()
    messages.push(...newMessages)
    await this.saveMessages(messages)
  },

  /**
   * Clear all stored messages
   */
  async clearMessages(): Promise<void> {
    try {
      await secureStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear messages from secure storage:', error)
    }
  },

  /**
   * Get the ID of the oldest stored message
   */
  async getOldestMessageId(): Promise<string | null> {
    const messages = await this.loadMessages()
    return messages.length > 0 ? messages[0].id : null
  },

  /**
   * Get the ID of the newest stored message
   */
  async getNewestMessageId(): Promise<string | null> {
    const messages = await this.loadMessages()
    return messages.length > 0 ? messages[messages.length - 1].id : null
  }
}
