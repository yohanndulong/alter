import { Capacitor } from '@capacitor/core'
import { PushNotifications } from '@capacitor/push-notifications'

/**
 * Service pour gérer le badge de notification iOS
 */
export const badgeService = {
  /**
   * Réinitialiser le badge à 0
   */
  async clearBadge(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    try {
      // iOS uniquement
      if (Capacitor.getPlatform() === 'ios') {
        await PushNotifications.removeAllDeliveredNotifications()
        console.log('✅ Badge cleared')
      }
    } catch (error) {
      console.error('Error clearing badge:', error)
    }
  },

  /**
   * Définir le nombre du badge
   */
  async setBadgeCount(count: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return
    }

    try {
      if (Capacitor.getPlatform() === 'ios') {
        // Sur iOS, on ne peut pas définir directement le badge via Capacitor
        // Il faut envoyer une notification locale ou le faire via du code natif
        if (count === 0) {
          await this.clearBadge()
        }
      }
    } catch (error) {
      console.error('Error setting badge count:', error)
    }
  },
}
