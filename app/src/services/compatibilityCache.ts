import { api } from './api'
import { CompatibilityCache, CompatibilityScores, User } from '@/types'
import { calculateProfileHash } from './profileHash'

/**
 * Service de cache pour les scores de compatibilité
 * Permet d'éviter de recalculer les compatibilités si les profils n'ont pas changé
 */

/**
 * Récupère le cache de compatibilité entre deux utilisateurs
 * @param userId - ID de l'utilisateur source
 * @param targetUserId - ID de l'utilisateur cible
 * @param userHash - Hash du profil utilisateur (pour validation)
 * @param targetHash - Hash du profil cible (pour validation)
 * @returns Le cache s'il existe et est valide, null sinon
 */
async function getCache(
  userId: string,
  targetUserId: string,
  userHash: string,
  targetHash: string
): Promise<CompatibilityCache | null> {
  try {
    const response = await api.get<CompatibilityCache>(
      `/compatibility/cache/${userId}/${targetUserId}`
    )

    // Vérifier que les hash correspondent (profils non modifiés)
    if (
      response.userProfileHash === userHash &&
      response.targetProfileHash === targetHash
    ) {
      // Vérifier l'expiration si définie
      if (response.expiresAt) {
        const now = new Date()
        const expiresAt = new Date(response.expiresAt)
        if (now > expiresAt) {
          console.log('⏰ Cache expired')
          return null
        }
      }

      console.log('✅ Cache hit')
      return response
    }

    console.log('🔄 Cache invalid (profiles changed)')
    return null
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log('❌ Cache miss')
      return null
    }
    throw error
  }
}

/**
 * Sauvegarde un cache de compatibilité
 * @param cache - Les données de compatibilité à sauvegarder
 */
async function saveCache(cache: Omit<CompatibilityCache, 'id' | 'calculatedAt'>): Promise<void> {
  await api.post('/compatibility/cache', cache)
}

/**
 * Récupère ou calcule la compatibilité entre deux utilisateurs
 * @param userId - ID de l'utilisateur source
 * @param targetUserId - ID de l'utilisateur cible
 * @param user - Profil complet de l'utilisateur source
 * @param target - Profil complet de l'utilisateur cible
 * @param calculateFn - Fonction de calcul de compatibilité (LLM)
 * @returns Les scores de compatibilité
 */
async function getOrCalculate(
  userId: string,
  targetUserId: string,
  user: User,
  target: User,
  calculateFn: (user: User, target: User) => Promise<CompatibilityScores>
): Promise<CompatibilityScores> {
  // Calculer les hash des profils
  const userHash = calculateProfileHash(user)
  const targetHash = calculateProfileHash(target)

  // Vérifier le cache
  const cached = await getCache(userId, targetUserId, userHash, targetHash)

  if (cached) {
    // Retourner depuis le cache
    return {
      global: cached.scoreGlobal,
      love: cached.scoreLove || 0,
      friendship: cached.scoreFriendship || 0,
      carnal: cached.scoreCarnal || 0,
      insight: cached.compatibilityInsight || '',
      embeddingScore: cached.embeddingScore
    }
  }

  // Cache miss : calculer avec LLM
  console.log('🤖 Calculating compatibility with LLM...')
  const scores = await calculateFn(user, target)

  // Sauvegarder en cache
  await saveCache({
    userId,
    targetUserId,
    scoreGlobal: scores.global,
    scoreLove: scores.love,
    scoreFriendship: scores.friendship,
    scoreCarnal: scores.carnal,
    compatibilityInsight: scores.insight,
    userProfileHash: userHash,
    targetProfileHash: targetHash,
    embeddingScore: scores.embeddingScore
  })

  return scores
}

/**
 * Invalide le cache pour un utilisateur donné
 * Utilisé lorsque le profil d'un utilisateur est modifié
 * @param userId - ID de l'utilisateur dont le cache doit être invalidé
 */
async function invalidateUserCache(userId: string): Promise<void> {
  await api.delete(`/compatibility/cache/user/${userId}`)
}

/**
 * Récupère les statistiques du cache
 * @returns Les statistiques d'utilisation du cache
 */
async function getCacheStats(): Promise<{
  totalEntries: number
  cacheHitRate: number
  oldestEntry: Date | null
  averageAge: number
}> {
  return api.get('/compatibility/cache/stats')
}

/**
 * Récupère plusieurs caches en batch
 * @param userId - ID de l'utilisateur source
 * @param targetUserIds - Liste des IDs des utilisateurs cibles
 * @returns Map des caches trouvés (clé = targetUserId)
 */
async function getBatchCache(
  userId: string,
  targetUserIds: string[]
): Promise<Map<string, CompatibilityCache>> {
  const response = await api.post<CompatibilityCache[]>('/compatibility/cache/batch', {
    userId,
    targetUserIds
  })

  const cacheMap = new Map<string, CompatibilityCache>()
  response.forEach(cache => {
    cacheMap.set(cache.targetUserId, cache)
  })

  return cacheMap
}

export const compatibilityCacheService = {
  getCache,
  saveCache,
  getOrCalculate,
  invalidateUserCache,
  getCacheStats,
  getBatchCache
}
