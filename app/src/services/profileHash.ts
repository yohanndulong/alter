import { User } from '@/types'

/**
 * Service pour calculer le hash d'un profil utilisateur
 * Le hash permet de détecter si un profil a changé depuis le dernier calcul de compatibilité
 */

interface ProfileHashData {
  bio?: string
  interests: string[]
  sexualOrientation?: string
  gender: string
  age: number
  profileAI?: Record<string, any>
  // Ajouter d'autres champs pertinents pour le matching
  // NE PAS inclure : photos, location, lastSeen, etc.
}

/**
 * Simple hash function (djb2 algorithm)
 * Plus rapide que crypto et suffisant pour détecter les changements
 */
function simpleHash(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

/**
 * Extrait les données pertinentes du profil pour le matching
 */
function extractRelevantData(user: User): ProfileHashData {
  return {
    bio: user.bio,
    interests: [...user.interests].sort(), // Sort pour avoir un ordre consistant
    sexualOrientation: user.sexualOrientation,
    gender: user.gender,
    age: user.age,
    profileAI: (user as any).profileAI // Le profileAI pourrait être ajouté au type User
  }
}

/**
 * Calcule un hash du profil utilisateur basé sur les champs pertinents pour le matching
 * @param user - L'utilisateur dont on veut calculer le hash
 * @returns Le hash du profil (string)
 */
export function calculateProfileHash(user: User): string {
  const relevantData = extractRelevantData(user)
  const dataString = JSON.stringify(relevantData)
  return simpleHash(dataString)
}

/**
 * Compare deux profils pour détecter des changements
 * @param user1 - Premier profil
 * @param user2 - Deuxième profil
 * @returns true si les profils ont le même hash, false sinon
 */
export function profilesAreEqual(user1: User, user2: User): boolean {
  return calculateProfileHash(user1) === calculateProfileHash(user2)
}

/**
 * Vérifie si un profil a changé depuis un hash donné
 * @param user - Le profil à vérifier
 * @param previousHash - Le hash précédent
 * @returns true si le profil a changé, false sinon
 */
export function profileHasChanged(user: User, previousHash: string): boolean {
  return calculateProfileHash(user) !== previousHash
}

export const profileHashService = {
  calculateProfileHash,
  profilesAreEqual,
  profileHasChanged
}
