import { Match } from '@/types'
import { secureStorage } from './secureStorage'

const STORAGE_KEY = 'matches_list_cache'
const CACHE_TIMESTAMP_KEY = 'matches_list_cache_timestamp'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes en millisecondes

/**
 * Service de cache pour la liste des matches
 * Permet d'afficher immédiatement les données en cache pendant le chargement
 */
export const matchesStorage = {
  /**
   * Sauvegarde la liste des matches dans le cache
   */
  async saveMatches(matches: Match[]): Promise<void> {
    try {
      await secureStorage.setItem(STORAGE_KEY, JSON.stringify(matches))
      await secureStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    } catch (error) {
      console.error('Failed to save matches to cache:', error)
    }
  },

  /**
   * Charge la liste des matches depuis le cache
   */
  async loadMatches(): Promise<Match[] | null> {
    try {
      const stored = await secureStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const matches = JSON.parse(stored) as Match[]

      // Convertir les timestamps en objets Date
      return matches.map(match => ({
        ...match,
        matchedAt: new Date(match.matchedAt),
        lastMessageAt: match.lastMessageAt ? new Date(match.lastMessageAt) : undefined,
      }))
    } catch (error) {
      console.error('Failed to load matches from cache:', error)
      return null
    }
  },

  /**
   * Vérifie si le cache est encore valide
   */
  async isCacheValid(): Promise<boolean> {
    try {
      const timestampStr = await secureStorage.getItem(CACHE_TIMESTAMP_KEY)
      if (!timestampStr) return false

      const timestamp = parseInt(timestampStr, 10)
      const now = Date.now()

      return (now - timestamp) < CACHE_DURATION
    } catch (error) {
      console.error('Failed to check cache validity:', error)
      return false
    }
  },

  /**
   * Vide le cache
   */
  async clearCache(): Promise<void> {
    try {
      await secureStorage.removeItem(STORAGE_KEY)
      await secureStorage.removeItem(CACHE_TIMESTAMP_KEY)
    } catch (error) {
      console.error('Failed to clear matches cache:', error)
    }
  },

  /**
   * Charge les matches depuis le cache si disponibles,
   * indique si le cache doit être rafraîchi
   */
  async loadMatchesWithStatus(): Promise<{
    matches: Match[] | null
    shouldRefresh: boolean
  }> {
    const matches = await this.loadMatches()
    const isValid = await this.isCacheValid()

    return {
      matches,
      shouldRefresh: !isValid || matches === null
    }
  }
}
