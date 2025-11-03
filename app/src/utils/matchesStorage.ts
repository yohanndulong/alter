import { Match } from '@/types'
import { alterDB } from './indexedDB'

/**
 * Service de cache pour la liste des matches
 * Utilise IndexedDB pour un stockage performant et sans limite de quota
 */
export const matchesStorage = {
  /**
   * Sauvegarde la liste des matches dans le cache
   */
  async saveMatches(matches: Match[]): Promise<void> {
    return alterDB.saveMatches(matches)
  },

  /**
   * Charge la liste des matches depuis le cache
   */
  async loadMatches(): Promise<Match[] | null> {
    return alterDB.loadMatches()
  },

  /**
   * Vérifie si le cache est encore valide
   */
  async isCacheValid(): Promise<boolean> {
    return alterDB.isMatchesCacheValid()
  },

  /**
   * Vide le cache
   */
  async clearCache(): Promise<void> {
    const db = await alterDB.loadMatches()
    if (db && db.length > 0) {
      // Supprimer tous les matches
      await alterDB.clearAll()
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
