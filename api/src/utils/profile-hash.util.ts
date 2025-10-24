import * as crypto from 'crypto';
import { User } from '../modules/users/entities/user.entity';

/**
 * Interface pour les données du profil utilisées pour le matching
 */
interface ProfileHashData {
  bio?: string;
  interests: string[];
  sexualOrientation?: string;
  gender: string;
  age: number;
  alterProfileAI?: Record<string, any>;
  // Ajouter d'autres champs pertinents pour le matching
  // NE PAS inclure : photos, location, lastSeen, etc.
}

/**
 * Extrait les données pertinentes du profil pour le matching
 */
function extractRelevantData(user: User | Partial<User>): ProfileHashData {
  return {
    bio: user.bio,
    interests: user.interests ? [...user.interests].sort() : [], // Sort pour cohérence
    sexualOrientation: user.sexualOrientation,
    gender: user.gender,
    age: user.age,
    alterProfileAI: user.alterProfileAI,
  };
}

/**
 * Calcule un hash SHA-256 du profil utilisateur
 * @param user - L'utilisateur dont on veut calculer le hash
 * @returns Le hash du profil (string hex)
 */
export function calculateProfileHash(user: User | Partial<User>): string {
  const relevantData = extractRelevantData(user);
  const dataString = JSON.stringify(relevantData);

  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Compare deux profils pour détecter des changements
 * @param user1 - Premier profil
 * @param user2 - Deuxième profil
 * @returns true si les profils ont le même hash, false sinon
 */
export function profilesAreEqual(
  user1: User | Partial<User>,
  user2: User | Partial<User>,
): boolean {
  return calculateProfileHash(user1) === calculateProfileHash(user2);
}

/**
 * Vérifie si un profil a changé depuis un hash donné
 * @param user - Le profil à vérifier
 * @param previousHash - Le hash précédent
 * @returns true si le profil a changé, false sinon
 */
export function profileHasChanged(
  user: User | Partial<User>,
  previousHash: string,
): boolean {
  return calculateProfileHash(user) !== previousHash;
}
