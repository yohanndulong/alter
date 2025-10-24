import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'

/**
 * Wrapper pour le stockage sécurisé qui utilise:
 * - Capacitor Preferences (Keychain/KeyStore) sur mobile
 * - localStorage sur web (fallback)
 */
class SecureStorage {
  private isNative: boolean

  constructor() {
    this.isNative = Capacitor.isNativePlatform()
  }

  /**
   * Récupère une valeur du stockage sécurisé
   */
  async getItem(key: string): Promise<string | null> {
    if (this.isNative) {
      const { value } = await Preferences.get({ key })
      return value
    } else {
      // Fallback sur localStorage pour web
      return localStorage.getItem(key)
    }
  }

  /**
   * Sauvegarde une valeur dans le stockage sécurisé
   */
  async setItem(key: string, value: string): Promise<void> {
    if (this.isNative) {
      await Preferences.set({ key, value })
    } else {
      // Fallback sur localStorage pour web
      localStorage.setItem(key, value)
    }
  }

  /**
   * Supprime une valeur du stockage sécurisé
   */
  async removeItem(key: string): Promise<void> {
    if (this.isNative) {
      await Preferences.remove({ key })
    } else {
      // Fallback sur localStorage pour web
      localStorage.removeItem(key)
    }
  }

  /**
   * Vide complètement le stockage sécurisé
   */
  async clear(): Promise<void> {
    if (this.isNative) {
      await Preferences.clear()
    } else {
      // Fallback sur localStorage pour web
      localStorage.clear()
    }
  }

  /**
   * Récupère toutes les clés du stockage
   */
  async keys(): Promise<string[]> {
    if (this.isNative) {
      const { keys } = await Preferences.keys()
      return keys
    } else {
      // Fallback sur localStorage pour web
      return Object.keys(localStorage)
    }
  }
}

export const secureStorage = new SecureStorage()
