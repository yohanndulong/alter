import { PrivacyScreen } from '@capacitor-community/privacy-screen'
import { Capacitor } from '@capacitor/core'

/**
 * Service pour gérer la protection contre les captures d'écran
 */
class PrivacyScreenService {
  private isNative = Capacitor.isNativePlatform()

  /**
   * Active la protection contre les captures d'écran
   */
  async enable(): Promise<void> {
    if (!this.isNative) {
      console.log('Privacy screen: Not available on web platform')
      return
    }

    try {
      await PrivacyScreen.enable()
      console.log('Privacy screen: Enabled - Screenshots blocked')
    } catch (error) {
      console.error('Failed to enable privacy screen:', error)
    }
  }

  /**
   * Désactive la protection contre les captures d'écran
   */
  async disable(): Promise<void> {
    if (!this.isNative) {
      return
    }

    try {
      await PrivacyScreen.disable()
      console.log('Privacy screen: Disabled - Screenshots allowed')
    } catch (error) {
      console.error('Failed to disable privacy screen:', error)
    }
  }

  /**
   * Vérifie si la plateforme est native
   */
  isAvailable(): boolean {
    return this.isNative
  }
}

export const privacyScreenService = new PrivacyScreenService()
