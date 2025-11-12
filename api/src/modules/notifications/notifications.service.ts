import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FcmToken } from './entities/fcm-token.entity';
import * as admin from 'firebase-admin';
import * as apn from 'apn';
import { RegisterTokenDto } from './dto/register-token.dto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private apnProvider: apn.Provider | null = null;

  constructor(
    @InjectRepository(FcmToken)
    private fcmTokenRepository: Repository<FcmToken>,
  ) {}

  onModuleInit() {
    // Initialiser Firebase Admin SDK pour Android
    try {
      if (!admin.apps.length) {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (serviceAccountJson) {
          try {
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
            this.logger.log('✅ Firebase Admin SDK initialisé (Android)');
          } catch (parseError) {
            this.logger.error('❌ Erreur parsing Firebase JSON:', parseError);
            this.logger.warn('⚠️ Vérifiez FIREBASE_SERVICE_ACCOUNT');
          }
        } else {
          this.logger.warn('⚠️ FIREBASE_SERVICE_ACCOUNT non défini - Notifications Android désactivées');
        }
      }
    } catch (error) {
      this.logger.error('❌ Erreur initialisation Firebase:', error);
    }

    // Initialiser APNs pour iOS
    try {
      const apnsKey = process.env.APNS_KEY; // Contenu du fichier .p8
      const apnsKeyId = process.env.APNS_KEY_ID;
      const apnsTeamId = process.env.APNS_TEAM_ID;
      const apnsBundleId = process.env.APNS_BUNDLE_ID || 'com.alterdating.alter';
      const apnsProduction = process.env.APNS_PRODUCTION === 'true';

      if (apnsKey && apnsKeyId && apnsTeamId) {
        // Nettoyer la clé (supprimer les espaces inutiles, garder les retours à la ligne)
        const cleanedKey = apnsKey.trim();

        this.apnProvider = new apn.Provider({
          token: {
            key: cleanedKey, // Contenu direct du .p8
            keyId: apnsKeyId,
            teamId: apnsTeamId,
          },
          production: apnsProduction,
        });
        this.logger.log(`✅ APNs initialisé (iOS) - ${apnsProduction ? 'Production' : 'Development'}`);
        this.logger.log(`   Bundle ID: ${apnsBundleId}`);
        this.logger.log(`   Key ID: ${apnsKeyId}`);
      } else {
        this.logger.warn('⚠️ Configuration APNs incomplète - Notifications iOS désactivées');
        this.logger.warn('💡 Variables requises: APNS_KEY (contenu .p8), APNS_KEY_ID, APNS_TEAM_ID');
      }
    } catch (error) {
      this.logger.error('❌ Erreur initialisation APNs:', error);
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
   * Détecte si un token est iOS (APNs) ou Android (FCM)
   */
  private isApnsToken(token: string): boolean {
    // Token APNs = 64 caractères hexadécimaux
    return /^[0-9A-Fa-f]{64}$/.test(token);
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
      this.logger.log(`\n========== 📲 ENVOI NOTIFICATION ==========`);
      this.logger.log(`👤 Destinataire: ${userId}`);
      this.logger.log(`📋 Type: ${data?.type || 'unknown'}`);
      this.logger.log(`📝 Titre: ${title}`);
      this.logger.log(`💬 Message: ${body}`);
      if (data && Object.keys(data).length > 0) {
        this.logger.log(`🔗 Data: ${JSON.stringify(data)}`);
      }

      // Récupérer tous les tokens actifs de l'utilisateur
      const tokens = await this.fcmTokenRepository.find({
        where: { userId, isActive: true },
      });

      if (tokens.length === 0) {
        this.logger.warn(`⚠️ Aucun token actif pour l'utilisateur ${userId}`);
        this.logger.log(`========== FIN NOTIFICATION (AUCUN TOKEN) ==========\n`);
        return;
      }

      this.logger.log(`📱 ${tokens.length} token(s) trouvé(s)`);

      // Séparer les tokens iOS et Android
      const iosTokens = tokens.filter(t => t.platform === 'ios' || this.isApnsToken(t.token));
      const androidTokens = tokens.filter(t => t.platform === 'android' && !this.isApnsToken(t.token));

      let successCount = 0;
      let failureCount = 0;
      const failedTokens: string[] = [];

      // Envoyer aux tokens iOS via APNs
      if (iosTokens.length > 0) {
        this.logger.log(`🍎 ${iosTokens.length} token(s) iOS`);

        if (this.apnProvider) {
          for (const tokenData of iosTokens) {
            try {
              const notification = new apn.Notification();
              notification.alert = {
                title,
                body,
              };
              notification.sound = 'default';
              notification.badge = 1;
              notification.topic = process.env.APNS_BUNDLE_ID || 'com.alterdating.alter';
              notification.payload = data || {};

              const result = await this.apnProvider.send(notification, tokenData.token);

              if (result.sent.length > 0) {
                this.logger.log(`  ✅ iOS token ${tokenData.token.substring(0, 20)}... envoyé`);
                successCount++;
              }

              if (result.failed.length > 0) {
                const failure = result.failed[0];
                this.logger.error(`  ❌ iOS token ${tokenData.token.substring(0, 20)}... échoué: ${failure.response?.reason || 'Unknown'}`);
                failedTokens.push(tokenData.token);
                failureCount++;
              }
            } catch (error) {
              this.logger.error(`  ❌ Erreur envoi iOS token ${tokenData.token.substring(0, 20)}:`, error.message);
              failedTokens.push(tokenData.token);
              failureCount++;
            }
          }
        } else {
          this.logger.warn('⚠️ APNs non initialisé - Tokens iOS ignorés');
          failureCount += iosTokens.length;
        }
      }

      // Envoyer aux tokens Android via Firebase
      if (androidTokens.length > 0) {
        this.logger.log(`🤖 ${androidTokens.length} token(s) Android`);

        if (admin.apps.length > 0) {
          const message = {
            notification: { title, body },
            data: data || {},
            tokens: androidTokens.map(t => t.token),
          };

          const response = await admin.messaging().sendEachForMulticast(message);

          successCount += response.successCount;
          failureCount += response.failureCount;

          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              const errorCode = resp.error?.code || 'unknown';
              this.logger.error(`  ❌ Android token ${androidTokens[idx].token.substring(0, 20)}...: ${errorCode}`);
              failedTokens.push(androidTokens[idx].token);
            } else {
              this.logger.log(`  ✅ Android token ${androidTokens[idx].token.substring(0, 20)}... envoyé`);
            }
          });
        } else {
          this.logger.warn('⚠️ Firebase non initialisé - Tokens Android ignorés');
          failureCount += androidTokens.length;
        }
      }

      // Rapport final
      this.logger.log(`✅ Notification envoyée à ${successCount}/${tokens.length} appareils`);

      // Désactiver les tokens invalides
      if (failedTokens.length > 0) {
        await this.fcmTokenRepository.update(
          { token: In(failedTokens) },
          { isActive: false },
        );
        this.logger.warn(`🗑️ ${failedTokens.length} tokens invalides désactivés`);
      }

      this.logger.log(`========== FIN NOTIFICATION ==========\n`);
    } catch (error) {
      this.logger.error(`❌ ERREUR lors de l'envoi de la notification à l'utilisateur ${userId}:`, error);
      this.logger.log(`========== FIN NOTIFICATION (ERREUR) ==========\n`);
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
    this.logger.log(`📨 Préparation notification MESSAGE: ${senderName} → User ${receiverId}`);

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
    this.logger.log(`💕 Préparation notification MATCH: User ${userId} a matché avec ${matchedUserName} (Match ID: ${matchId})`);

    await this.sendNotificationToUser(
      userId,
      'Nouveau match ! 💕',
      `Vous avez matché avec ${matchedUserName} !`,
      {
        type: 'new_match',
        matchId,
      },
    );
  }

  /**
   * Envoie une notification pour un nouveau like
   */
  async sendNewLikeNotification(
    userId: string,
    likerName: string,
  ): Promise<void> {
    this.logger.log(`💖 Préparation notification LIKE: ${likerName} a liké User ${userId}`);

    await this.sendNotificationToUser(
      userId,
      'Quelqu\'un vous aime ! 💖',
      `${likerName} vous a liké !`,
      {
        type: 'new_like',
      },
    );
  }
}
