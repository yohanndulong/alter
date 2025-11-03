import { Message } from '@/types'
import { alterDB } from './indexedDB'

/**
 * Utility for managing user chat messages in IndexedDB
 * Each match has its own storage
 * Utilise IndexedDB pour un stockage performant et sans limite de quota
 */
export const userChatStorage = {
  /**
   * Save messages for a specific match to IndexedDB
   */
  async saveMessages(matchId: string, messages: Message[]): Promise<void> {
    return alterDB.saveMessages(matchId, messages)
  },

  /**
   * Load messages for a specific match from IndexedDB
   */
  async loadMessages(matchId: string): Promise<Message[]> {
    return alterDB.loadMessages(matchId)
  },

  /**
   * Add a new message to the stored messages
   */
  async addMessage(matchId: string, message: Message): Promise<void> {
    return alterDB.addMessage(matchId, message)
  },

  /**
   * Add multiple messages to the stored messages
   */
  async addMessages(matchId: string, newMessages: Message[]): Promise<void> {
    // Charger les messages existants
    const existingMessages = await this.loadMessages(matchId)
    const allMessages = [...existingMessages, ...newMessages]
    // Sauvegarder tous les messages
    await this.saveMessages(matchId, allMessages)
  },

  /**
   * Update an existing message in storage
   */
  async updateMessage(matchId: string, messageId: string, updates: Partial<Message>): Promise<void> {
    return alterDB.updateMessage(matchId, messageId, updates)
  },

  /**
   * Clear stored messages for a specific match
   */
  async clearMessages(matchId: string): Promise<void> {
    return alterDB.clearMessages(matchId)
  },

  /**
   * Clear all stored user chat messages
   */
  async clearAllMessages(): Promise<void> {
    return alterDB.clearAll()
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
