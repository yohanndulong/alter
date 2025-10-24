import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FcmToken } from './entities/fcm-token.entity';
import * as admin from 'firebase-admin';
import { RegisterTokenDto } from './dto/register-token.dto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(FcmToken)
    private fcmTokenRepository: Repository<FcmToken>,
  ) {}

  onModuleInit() {
    // Initialiser Firebase Admin SDK
    // IMPORTANT: La variable d'environnement doit contenir le JSON complet
    try {
      if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (serviceAccountJson) {
          try {
            // Parser le JSON depuis la variable d'environnement
            const serviceAccount = JSON.parse(serviceAccountJson);

            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
            this.logger.log('✅ Firebase Admin SDK initialisé');
          } catch (parseError) {
            this.logger.error('❌ Erreur lors du parsing du JSON Firebase:', parseError);
            this.logger.warn('⚠️ Vérifiez que FIREBASE_SERVICE_ACCOUNT contient un JSON valide');
          }
        } else {
          this.logger.warn('⚠️ FIREBASE_SERVICE_ACCOUNT non défini - Les notifications push ne fonctionneront pas');
          this.logger.warn('💡 Ajoutez le contenu de google-services.json dans la variable d\'environnement FIREBASE_SERVICE_ACCOUNT');
        }
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'initialisation de Firebase Admin SDK:', error);
    }
  }

  /**
   * Enregistre un token FCM pour un utilisateur
   */
  async registerToken(userId: string, dto: RegisterTokenDto): Promise<FcmToken> {
    try {
      // Vérifier si le token existe déjà pour cet utilisateur
      let fcmToken = await this.fcmTokenRepository.findOne({
        where: { userId, token: dto.token },
      });

      if (fcmToken) {
        // Réactiver le token s'il était désactivé
        fcmToken.isActive = true;
        fcmToken.platform = dto.platform || 'android';
        return await this.fcmTokenRepository.save(fcmToken);
      }

      // Créer un nouveau token
      fcmToken = this.fcmTokenRepository.create({
        userId,
        token: dto.token,
        platform: dto.platform || 'android',
        isActive: true,
      });

      const savedToken = await this.fcmTokenRepository.save(fcmToken);
      this.logger.log(`📱 Token FCM enregistré pour l'utilisateur ${userId}`);

      return savedToken;
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'enregistrement du token FCM:`, error);
      throw error;
    }
  }

  /**
   * Désenregistre un token FCM
   */
  async unregisterToken(userId: string, token: string): Promise<void> {
    try {
      await this.fcmTokenRepository.update(
        { userId, token },
        { isActive: false },
      );
      this.logger.log(`📱 Token FCM désenregistré pour l'utilisateur ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Erreur lors du désenregistrement du token FCM:`, error);
      throw error;
    }
  }

  /**
   * Envoie une notification push à un utilisateur
   */
  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    try {
      // Récupérer tous les tokens actifs de l'utilisateur
      const tokens = await this.fcmTokenRepository.find({
        where: { userId, isActive: true },
      });

      if (tokens.length === 0) {
        this.logger.warn(`⚠️ Aucun token FCM actif pour l'utilisateur ${userId}`);
        return;
      }

      // Préparer le message
      const message = {
        notification: {
          title,
          body,
        },
        data: data || {},
        tokens: tokens.map(t => t.token),
      };

      // Envoyer la notification
      if (admin.apps.length > 0) {
        const response = await admin.messaging().sendEachForMulticast(message);

        this.logger.log(`📲 Notification envoyée à ${response.successCount}/${tokens.length} appareils pour l'utilisateur ${userId}`);

        // Désactiver les tokens invalides
        if (response.failureCount > 0) {
          const failedTokens: string[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(tokens[idx].token);
            }
          });

          if (failedTokens.length > 0) {
            await this.fcmTokenRepository.update(
              { token: In(failedTokens) },
              { isActive: false },
            );
            this.logger.warn(`⚠️ ${failedTokens.length} tokens invalides désactivés`);
          }
        }
      } else {
        this.logger.warn('⚠️ Firebase Admin SDK non initialisé - Impossible d\'envoyer la notification');
      }
    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'envoi de la notification à l'utilisateur ${userId}:`, error);
    }
  }

  /**
   * Envoie une notification pour un nouveau message
   */
  async sendNewMessageNotification(
    receiverId: string,
    senderName: string,
    messageContent: string,
    matchId: string,
  ): Promise<void> {
    await this.sendNotificationToUser(
      receiverId,
      `Nouveau message de ${senderName}`,
      messageContent,
      {
        type: 'new_message',
        matchId,
      },
    );
  }

  /**
   * Envoie une notification pour un nouveau match
   */
  async sendNewMatchNotification(
    userId: string,
    matchedUserName: string,
    matchId: string,
  ): Promise<void> {
    await this.sendNotificationToUser(
      userId,
      'Nouveau match !',
      `Vous avez matché avec ${matchedUserName} !`,
      {
        type: 'new_match',
        matchId,
      },
    );
  }
}
