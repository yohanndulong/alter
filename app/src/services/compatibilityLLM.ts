import { api } from './api'
import { User, CompatibilityScores } from '@/types'

/**
 * Service de calcul de compatibilité via LLM
 * Utilise l'IA pour analyser les profils et calculer des scores de compatibilité personnalisés
 */

/**
 * Calcule la compatibilité entre deux utilisateurs via le LLM
 * @param user - Profil de l'utilisateur source
 * @param target - Profil de l'utilisateur cible
 * @returns Les scores de compatibilité calculés par l'IA
 */
async function calculateCompatibility(
  user: User,
  target: User
): Promise<CompatibilityScores> {
  try {
    const response = await api.post<CompatibilityScores>(
      '/compatibility/calculate',
      {
        userId: user.id,
        targetUserId: target.id,
        // Envoyer les données nécessaires pour le calcul
        user: {
          bio: user.bio,
          interests: user.interests,
          age: user.age,
          gender: user.gender,
          sexualOrientation: user.sexualOrientation,
          profileAI: (user as any).profileAI
        },
        target: {
          bio: target.bio,
          interests: target.interests,
          age: target.age,
          gender: target.gender,
          sexualOrientation: target.sexualOrientation,
          profileAI: (target as any).profileAI
        }
      }
    )

    return response
  } catch (error) {
    console.error('Error calculating compatibility:', error)
    throw error
  }
}

/**
 * Calcule la compatibilité pour plusieurs profils en batch
 * Optimisation : une seule requête LLM pour plusieurs profils
 * @param user - Profil de l'utilisateur source
 * @param targets - Liste des profils cibles
 * @returns Map des scores (clé = targetUserId)
 */
async function calculateBatchCompatibility(
  user: User,
  targets: User[]
): Promise<Map<string, CompatibilityScores>> {
  try {
    const response = await api.post<{ [targetId: string]: CompatibilityScores }>(
      '/compatibility/calculate/batch',
      {
        userId: user.id,
        user: {
          bio: user.bio,
          interests: user.interests,
          age: user.age,
          gender: user.gender,
          sexualOrientation: user.sexualOrientation,
          profileAI: (user as any).profileAI
        },
        targets: targets.map(target => ({
          id: target.id,
          bio: target.bio,
          interests: target.interests,
          age: target.age,
          gender: target.gender,
          sexualOrientation: target.sexualOrientation,
          profileAI: (target as any).profileAI
        }))
      }
    )

    // Convertir en Map
    const scoresMap = new Map<string, CompatibilityScores>()
    Object.entries(response).forEach(([targetId, scores]) => {
      scoresMap.set(targetId, scores)
    })

    return scoresMap
  } catch (error) {
    console.error('Error calculating batch compatibility:', error)
    throw error
  }
}

/**
 * Génère un insight de compatibilité via le LLM
 * Utilisé pour régénérer uniquement l'insight sans recalculer tous les scores
 * @param user - Profil de l'utilisateur source
 * @param target - Profil de l'utilisateur cible
 * @param scores - Scores déjà calculés
 * @returns L'insight généré
 */
async function generateInsight(
  user: User,
  target: User,
  scores: Omit<CompatibilityScores, 'insight'>
): Promise<string> {
  try {
    const response = await api.post<{ insight: string }>(
      '/compatibility/insight',
      {
        userId: user.id,
        targetUserId: target.id,
        scores,
        user: {
          bio: user.bio,
          interests: user.interests,
          profileAI: (user as any).profileAI
        },
        target: {
          bio: target.bio,
          interests: target.interests,
          profileAI: (target as any).profileAI
        }
      }
    )

    return response.insight
  } catch (error) {
    console.error('Error generating insight:', error)
    throw error
  }
}

/**
 * Demande un recalcul de compatibilité en arrière-plan (job queue)
 * Utilisé après une modification de profil pour recalculer toutes les compatibilités
 * @param userId - ID de l'utilisateur dont le profil a changé
 */
async function queueRecalculation(userId: string): Promise<void> {
  try {
    await api.post('/compatibility/recalculate/queue', { userId })
    console.log(`✅ Queued compatibility recalculation for user ${userId}`)
  } catch (error) {
    console.error('Error queueing recalculation:', error)
    throw error
  }
}

/**
 * Vérifie le statut d'un job de recalcul
 * @param jobId - ID du job de recalcul
 * @returns Le statut du job
 */
async function getRecalculationStatus(jobId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  total: number
  errors?: string[]
}> {
  return api.get(`/compatibility/recalculate/status/${jobId}`)
}

export const compatibilityLLMService = {
  calculateCompatibility,
  calculateBatchCompatibility,
  generateInsight,
  queueRecalculation,
  getRecalculationStatus
}
