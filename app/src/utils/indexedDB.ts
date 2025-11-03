import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Match, Message } from '@/types'

/**
 * Schema de la base de données IndexedDB
 */
interface AlterDB extends DBSchema {
  matches: {
    key: string
    value: {
      id: string
      data: Match
      timestamp: number
    }
    indexes: { 'by-timestamp': number }
  }
  messages: {
    key: string // Format: `${matchId}-${messageId}`
    value: {
      id: string
      matchId: string
      data: Message
      timestamp: number
    }
    indexes: { 'by-match': string; 'by-timestamp': number }
  }
  metadata: {
    key: string
    value: {
      key: string
      value: any
      timestamp: number
    }
  }
}

const DB_NAME = 'alter-app'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<AlterDB> | null = null

/**
 * Initialise et retourne l'instance de la base de données
 */
async function getDB(): Promise<IDBPDatabase<AlterDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<AlterDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store pour les matches
      if (!db.objectStoreNames.contains('matches')) {
        const matchStore = db.createObjectStore('matches', { keyPath: 'id' })
        matchStore.createIndex('by-timestamp', 'timestamp')
      }

      // Store pour les messages
      if (!db.objectStoreNames.contains('messages')) {
        const messageStore = db.createObjectStore('messages', { keyPath: 'id' })
        messageStore.createIndex('by-match', 'matchId')
        messageStore.createIndex('by-timestamp', 'timestamp')
      }

      // Store pour les métadonnées (cache timestamps, etc.)
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' })
      }
    },
  })

  return dbInstance
}

/**
 * Service IndexedDB pour le cache des données Alter
 */
export const alterDB = {
  /**
   * Sauvegarde la liste des matches
   */
  async saveMatches(matches: Match[]): Promise<void> {
    try {
      const db = await getDB()
      const tx = db.transaction('matches', 'readwrite')
      const store = tx.objectStore('matches')
      const timestamp = Date.now()

      // Limiter à 50 matches les plus récents pour optimiser l'espace
      const matchesToSave = matches.slice(0, 50)

      // Vider les anciens matches d'abord
      await store.clear()

      // Sauvegarder les nouveaux
      for (const match of matchesToSave) {
        await store.put({
          id: match.id,
          data: match,
          timestamp,
        })
      }

      await tx.done

      // Sauvegarder le timestamp de mise à jour
      await this.setMetadata('matches-updated-at', timestamp)

      console.log(`✅ Saved ${matchesToSave.length} matches to IndexedDB`)
    } catch (error) {
      console.error('Failed to save matches to IndexedDB:', error)
    }
  },

  /**
   * Charge la liste des matches depuis IndexedDB
   */
  async loadMatches(): Promise<Match[] | null> {
    try {
      const db = await getDB()
      const allMatches = await db.getAll('matches')

      if (allMatches.length === 0) {
        return null
      }

      // Trier par timestamp décroissant et retourner les données
      const matches = allMatches
        .sort((a, b) => b.timestamp - a.timestamp)
        .map(item => item.data)

      console.log(`✅ Loaded ${matches.length} matches from IndexedDB`)
      return matches
    } catch (error) {
      console.error('Failed to load matches from IndexedDB:', error)
      return null
    }
  },

  /**
   * Vérifie si le cache des matches est valide (< 5 minutes)
   */
  async isMatchesCacheValid(): Promise<boolean> {
    try {
      const updatedAt = await this.getMetadata<number>('matches-updated-at')
      if (!updatedAt) return false

      const fiveMinutes = 5 * 60 * 1000
      return Date.now() - updatedAt < fiveMinutes
    } catch (error) {
      return false
    }
  },

  /**
   * Sauvegarde les messages d'un match
   */
  async saveMessages(matchId: string, messages: Message[]): Promise<void> {
    try {
      const db = await getDB()
      const tx = db.transaction('messages', 'readwrite')
      const store = tx.objectStore('messages')
      const timestamp = Date.now()

      // Limiter à 200 messages les plus récents par conversation
      const messagesToSave = messages.slice(-200)

      // Supprimer les anciens messages de ce match
      const oldMessages = await store.index('by-match').getAllKeys(matchId)
      for (const key of oldMessages) {
        await store.delete(key)
      }

      // Sauvegarder les nouveaux
      for (const message of messagesToSave) {
        await store.put({
          id: `${matchId}-${message.id}`,
          matchId,
          data: message,
          timestamp,
        })
      }

      await tx.done

      console.log(`✅ Saved ${messagesToSave.length} messages for match ${matchId} to IndexedDB`)
    } catch (error) {
      console.error('Failed to save messages to IndexedDB:', error)
    }
  },

  /**
   * Charge les messages d'un match depuis IndexedDB
   */
  async loadMessages(matchId: string): Promise<Message[]> {
    try {
      const db = await getDB()
      const allMessages = await db.getAllFromIndex('messages', 'by-match', matchId)

      const messages = allMessages
        .sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime())
        .map(item => item.data)

      console.log(`✅ Loaded ${messages.length} messages for match ${matchId} from IndexedDB`)
      return messages
    } catch (error) {
      console.error('Failed to load messages from IndexedDB:', error)
      return []
    }
  },

  /**
   * Ajoute un message au cache
   */
  async addMessage(matchId: string, message: Message): Promise<void> {
    try {
      const db = await getDB()
      await db.put('messages', {
        id: `${matchId}-${message.id}`,
        matchId,
        data: message,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('Failed to add message to IndexedDB:', error)
    }
  },

  /**
   * Met à jour un message dans le cache
   */
  async updateMessage(matchId: string, messageId: string, updates: Partial<Message>): Promise<void> {
    try {
      const db = await getDB()
      const key = `${matchId}-${messageId}`
      const existing = await db.get('messages', key)

      if (existing) {
        existing.data = { ...existing.data, ...updates }
        existing.timestamp = Date.now()
        await db.put('messages', existing)
      }
    } catch (error) {
      console.error('Failed to update message in IndexedDB:', error)
    }
  },

  /**
   * Supprime les messages d'un match
   */
  async clearMessages(matchId: string): Promise<void> {
    try {
      const db = await getDB()
      const tx = db.transaction('messages', 'readwrite')
      const store = tx.objectStore('messages')
      const keys = await store.index('by-match').getAllKeys(matchId)

      for (const key of keys) {
        await store.delete(key)
      }

      await tx.done
      console.log(`✅ Cleared messages for match ${matchId}`)
    } catch (error) {
      console.error('Failed to clear messages from IndexedDB:', error)
    }
  },

  /**
   * Sauvegarde une métadonnée
   */
  async setMetadata<T>(key: string, value: T): Promise<void> {
    try {
      const db = await getDB()
      await db.put('metadata', {
        key,
        value,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error('Failed to set metadata in IndexedDB:', error)
    }
  },

  /**
   * Charge une métadonnée
   */
  async getMetadata<T>(key: string): Promise<T | null> {
    try {
      const db = await getDB()
      const item = await db.get('metadata', key)
      return item ? item.value : null
    } catch (error) {
      console.error('Failed to get metadata from IndexedDB:', error)
      return null
    }
  },

  /**
   * Vide tout le cache
   */
  async clearAll(): Promise<void> {
    try {
      const db = await getDB()
      const tx = db.transaction(['matches', 'messages', 'metadata'], 'readwrite')

      await tx.objectStore('matches').clear()
      await tx.objectStore('messages').clear()
      await tx.objectStore('metadata').clear()

      await tx.done
      console.log('✅ Cleared all IndexedDB data')
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error)
    }
  },

  /**
   * Obtient la taille approximative du cache (nombre d'entrées)
   */
  async getCacheSize(): Promise<{ matches: number; messages: number }> {
    try {
      const db = await getDB()
      const matchesCount = await db.count('matches')
      const messagesCount = await db.count('messages')

      return { matches: matchesCount, messages: messagesCount }
    } catch (error) {
      console.error('Failed to get cache size:', error)
      return { matches: 0, messages: 0 }
    }
  },

  /**
   * Met à jour un match spécifique dans le cache
   */
  async updateMatch(matchId: string, updates: Partial<Match>): Promise<void> {
    try {
      const db = await getDB()
      const existing = await db.get('matches', matchId)

      if (existing) {
        existing.data = { ...existing.data, ...updates }
        existing.timestamp = Date.now()
        await db.put('matches', existing)
        console.log(`✅ Updated match ${matchId} in IndexedDB`)
      }
    } catch (error) {
      console.error('Failed to update match in IndexedDB:', error)
    }
  },

  /**
   * Met à jour le unreadCount d'un match
   */
  async updateMatchUnreadCount(matchId: string, increment: number): Promise<void> {
    try {
      const db = await getDB()
      const existing = await db.get('matches', matchId)

      if (existing) {
        existing.data.unreadCount = Math.max(0, (existing.data.unreadCount || 0) + increment)
        existing.timestamp = Date.now()
        await db.put('matches', existing)
        console.log(`✅ Updated unreadCount for match ${matchId}: ${existing.data.unreadCount}`)
      }
    } catch (error) {
      console.error('Failed to update match unreadCount in IndexedDB:', error)
    }
  },

  /**
   * Met à jour le dernier message d'un match
   */
  async updateMatchLastMessage(matchId: string, lastMessage: string, lastMessageAt: Date): Promise<void> {
    try {
      const db = await getDB()
      const existing = await db.get('matches', matchId)

      if (existing) {
        existing.data.lastMessage = lastMessage
        existing.data.lastMessageAt = lastMessageAt
        existing.timestamp = Date.now()
        await db.put('matches', existing)
        console.log(`✅ Updated lastMessage for match ${matchId}`)
      }
    } catch (error) {
      console.error('Failed to update match lastMessage in IndexedDB:', error)
    }
  },
}
