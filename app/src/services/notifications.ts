import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications'
import { api } from './api'

class NotificationService {
  private token: string | null = null

  /**
   * Initialise le service de notifications
   * - Demande la permission
   * - Enregistre le token FCM
   * - Configure les listeners
   */
  async initialize(): Promise<void> {
    try {
      // Demander la permission
      const permissionStatus = await PushNotifications.requestPermissions()

      if (permissionStatus.receive === 'granted') {
        // Enregistrer pour recevoir les notifications
        await PushNotifications.register()

        // Listener pour le token
        await PushNotifications.addListener('registration', async (token: Token) => {
          console.log('📱 Push notification token:', token.value)
          this.token = token.value
          await this.sendTokenToBackend(token.value)
        })

        // Listener pour les erreurs d'enregistrement
        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('❌ Erreur d\'enregistrement de notification:', error)
        })

        // Listener pour les notifications reçues (app au premier plan)
        await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            console.log('🔔 Notification reçue (foreground):', notification)
            // Vous pouvez afficher une notification locale ici si besoin
          }
        )

        // Listener pour les actions sur les notifications (app en arrière-plan)
        await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            console.log('🔔 Action sur notification:', action)

            // Naviguer vers la bonne page selon le type de notification
            const data = action.notification.data

            if (data.type === 'new_message' && data.matchId) {
              // Naviguer vers le chat
              window.location.href = `/chat/${data.matchId}`
            } else if (data.type === 'new_match' && data.matchId) {
              // Naviguer vers les matchs
              window.location.href = '/matches'
            }
          }
        )

        console.log('✅ Service de notifications initialisé')
      } else {
        console.warn('⚠️ Permission de notification refusée')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des notifications:', error)
    }
  }

  /**
   * Envoie le token FCM au backend
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      await api.post('/notifications/register-token', { token })
      console.log('✅ Token FCM envoyé au backend')
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du token au backend:', error)
    }
  }

  /**
   * Supprime le token du backend (lors de la déconnexion)
   */
  async unregister(): Promise<void> {
    try {
      if (this.token) {
        await api.post('/notifications/unregister-token', { token: this.token })
      }
      await PushNotifications.removeAllListeners()
      console.log('✅ Notifications désactivées')
    } catch (error) {
      console.error('❌ Erreur lors de la désinscription des notifications:', error)
    }
  }

  /**
   * Obtenir le nombre de notifications en attente
   */
  async getDeliveredNotifications(): Promise<PushNotificationSchema[]> {
    const result = await PushNotifications.getDeliveredNotifications()
    return result.notifications
  }

  /**
   * Supprimer toutes les notifications affichées
   */
  async removeAllDeliveredNotifications(): Promise<void> {
    await PushNotifications.removeAllDeliveredNotifications()
  }
}

export const notificationService = new NotificationService()
