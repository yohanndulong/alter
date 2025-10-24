import { api } from './api'
import { User, Match, SearchFilters, DiscoverProfilesResponse } from '@/types'
import { compatibilityCacheService } from './compatibilityCache'
import { compatibilityLLMService } from './compatibilityLLM'

/**
 * Service de matching avec système de cache et filtres avancés
 */

/**
 * Récupère les profils à découvrir avec compatibilité calculée
 * Workflow en 3 étapes :
 * 1. Filtrage SQL (critères de base)
 * 2. Filtrage par embedding (similarité vectorielle)
 * 3. Calcul/récupération des scores LLM (avec cache)
 *
 * @param filters - Filtres de recherche optionnels
 * @returns Les profils avec scores de compatibilité
 */
async function getDiscoverProfiles(filters?: Partial<SearchFilters>): Promise<DiscoverProfilesResponse> {
  try {
    // Étape 1 & 2 : Le backend fait le filtrage SQL + embedding
    const response = await api.post<DiscoverProfilesResponse>(
      '/matching/discover',
      { filters }
    )

    // Les scores de compatibilité sont déjà attachés aux profils
    // Le backend a utilisé le cache quand possible
    return response
  } catch (error) {
    console.error('Error fetching discover profiles:', error)
    throw error
  }
}

/**
 * Récupère les profils à découvrir avec calcul client-side (pour mock/dev)
 * Cette version calcule les compatibilités côté client
 *
 * @param currentUser - L'utilisateur actuel
 * @param candidates - Liste des candidats potentiels
 * @returns Les profils avec scores calculés
 */
async function getDiscoverProfilesWithClientCalculation(
  currentUser: User,
  candidates: User[]
): Promise<User[]> {
  const profilesWithScores: User[] = []
  let cacheHits = 0
  let cacheMisses = 0

  for (const candidate of candidates) {
    try {
      // Utilise le cache ou calcule avec LLM
      const scores = await compatibilityCacheService.getOrCalculate(
        currentUser.id,
        candidate.id,
        currentUser,
        candidate,
        compatibilityLLMService.calculateCompatibility
      )

      if (scores.embeddingScore !== undefined) {
        cacheHits++
      } else {
        cacheMisses++
      }

      // Attacher les scores au profil
      profilesWithScores.push({
        ...candidate,
        compatibilityScoreGlobal: scores.global,
        compatibilityScoreLove: scores.love,
        compatibilityScoreFriendship: scores.friendship,
        compatibilityScoreCarnal: scores.carnal,
        compatibilityInsight: scores.insight
      })
    } catch (error) {
      console.error(`Error calculating compatibility for ${candidate.id}:`, error)
      // En cas d'erreur, on ajoute le profil sans scores
      profilesWithScores.push(candidate)
    }
  }

  console.log(`📊 Cache stats: ${cacheHits} hits, ${cacheMisses} misses`)

  // Trier par score global décroissant
  return profilesWithScores.sort(
    (a, b) => (b.compatibilityScoreGlobal || 0) - (a.compatibilityScoreGlobal || 0)
  )
}

/**
 * Like un profil
 * @param userId - ID du profil à liker
 * @returns Informations sur le match éventuel
 */
async function likeProfile(userId: string): Promise<{ match: boolean; matchData?: Match }> {
  return api.post(`/matching/like/${userId}`)
}

/**
 * Passe un profil (swipe left)
 * @param userId - ID du profil à passer
 */
async function passProfile(userId: string): Promise<void> {
  return api.post(`/matching/pass/${userId}`)
}

/**
 * Récupère tous les matchs de l'utilisateur
 * @returns Liste des matchs
 */
async function getMatches(): Promise<Match[]> {
  return api.get<Match[]>('/matching/matches')
}

/**
 * Récupère les profils qui ont liké l'utilisateur actuel
 * @returns Liste des profils intéressés
 */
async function getInterestedProfiles(): Promise<User[]> {
  return api.get<User[]>('/matching/interested')
}

/**
 * Supprime un match (unmatch)
 * @param matchId - ID du match à supprimer
 * @returns Informations sur le slot libéré
 */
async function unmatch(matchId: string): Promise<{
  message: string
  canLikeAgain: boolean
  remainingSlots: number
}> {
  return api.delete(`/matching/matches/${matchId}`)
}

/**
 * Récupère le statut des conversations
 * @returns Nombre de conversations actives et limite
 */
async function getConversationsStatus(): Promise<{
  activeConversations: number
  maxConversations: number
  remainingSlots: number
  canLike: boolean
}> {
  return api.get('/matching/conversations/status')
}

/**
 * Met à jour les filtres de recherche de l'utilisateur
 * @param filters - Nouveaux filtres
 */
async function updateSearchFilters(filters: Partial<SearchFilters>): Promise<void> {
  await api.put('/users/me/filters', filters)
}

/**
 * Force le recalcul des compatibilités pour l'utilisateur actuel
 * Utilisé après une modification de profil importante
 */
async function recalculateCompatibilities(): Promise<{ jobId: string }> {
  const response = await api.post<{ jobId: string }>('/matching/recalculate')
  return response
}

/**
 * Calcule la compatibilité entre l'utilisateur actuel et un profil spécifique
 * Force un nouveau calcul même si un cache existe
 * @param targetUserId - ID du profil cible
 */
async function calculateSpecificCompatibility(targetUserId: string): Promise<{
  global: number
  love: number
  friendship: number
  carnal: number
  insight: string
}> {
  return api.post(`/matching/calculate/${targetUserId}`)
}

export const matchingService = {
  getDiscoverProfiles,
  getDiscoverProfilesWithClientCalculation,
  likeProfile,
  passProfile,
  getMatches,
  getInterestedProfiles,
  unmatch,
  getConversationsStatus,
  updateSearchFilters,
  recalculateCompatibilities,
  calculateSpecificCompatibility
}
