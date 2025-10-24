import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageMedia, PhotoViewMode, MediaReceiverStatus } from './entities/message-media.entity';
import { ModerationService } from './moderation.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir: string;
  private readonly maxFileSize: number;

  constructor(
    @InjectRepository(MessageMedia)
    private readonly mediaRepository: Repository<MessageMedia>,
    private readonly moderationService: ModerationService,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads/chat-media';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB max

    // Créer le dossier s'il n'existe pas
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`📁 Upload directory ready: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`);
    }
  }

  /**
   * Upload un fichier vocal
   */
  async uploadVoiceMessage(
    messageId: string,
    file: Express.Multer.File,
    duration?: number,
  ): Promise<MessageMedia> {
    this.logger.log(`🎤 Uploading voice message for message ${messageId}`);

    // Validation du fichier
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File too large');
    }

    // Vérifier que c'est bien un fichier audio
    if (!file.mimetype.startsWith('audio/')) {
      throw new BadRequestException('Invalid file type: must be audio');
    }

    // Générer un nom de fichier unique (pour l'ID uniquement)
    const filename = this.generateFilename('voice', file.originalname);

    // Créer l'entrée en base avec les données binaires
    const media = this.mediaRepository.create({
      messageId,
      filePath: filename, // Utilisé comme identifiant unique
      fileData: file.buffer, // Stocker les données en base
      mimeType: file.mimetype,
      fileSize: file.size,
      duration,
    });

    await this.mediaRepository.save(media);

    this.logger.log(`✅ Voice message uploaded to database: ${filename}`);
    return media;
  }

  /**
   * Upload une photo avec modération
   */
  async uploadPhotoMessage(
    messageId: string,
    file: Express.Multer.File,
    options: {
      isReel?: boolean;
      viewMode: PhotoViewMode;
      viewDuration?: number;
    },
  ): Promise<MessageMedia> {
    this.logger.log(`📸 Uploading photo message for message ${messageId}`);

    // Validation du fichier
    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File too large');
    }

    // Vérifier que c'est bien une image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Invalid file type: must be image');
    }

    // Générer un nom de fichier unique
    const filename = this.generateFilename('photo', file.originalname);
    const tempFilePath = path.join(this.uploadDir, filename);

    // Sauvegarder temporairement pour modération
    await fs.writeFile(tempFilePath, file.buffer);

    // Modération de l'image
    const moderationResult = await this.moderationService.moderateImage(tempFilePath);

    // Supprimer le fichier temporaire
    try {
      await fs.unlink(tempFilePath);
    } catch (error) {
      this.logger.warn(`Failed to delete temp file: ${error.message}`);
    }

    // Créer l'entrée en base avec les données binaires
    const media = this.mediaRepository.create({
      messageId,
      filePath: filename, // Utilisé comme identifiant unique
      fileData: file.buffer, // Stocker les données en base
      mimeType: file.mimetype,
      fileSize: file.size,
      isReel: options.isReel || false,
      viewMode: options.viewMode,
      viewDuration: options.viewDuration,
      moderationResult,
      // Si le contenu n'est pas safe, il faut l'accord du destinataire
      receiverStatus: moderationResult.isSafe
        ? MediaReceiverStatus.ACCEPTED
        : MediaReceiverStatus.PENDING,
    });

    await this.mediaRepository.save(media);

    if (!moderationResult.isSafe) {
      this.logger.warn(`⚠️  Photo contains sensitive content: ${moderationResult.warnings.join(', ')}`);
    } else {
      this.logger.log(`✅ Photo uploaded to database and passed moderation: ${filename}`);
    }

    return media;
  }

  /**
   * Génère une URL signée pour accéder au média
   */
  generateSignedUrl(filename: string, expiresIn: number = 3600): string {
    const timestamp = Date.now() + expiresIn * 1000;
    const signature = this.generateSignature(filename, timestamp);
    const baseUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    return `${baseUrl}/api/chat/matches/media/${filename}?expires=${timestamp}&signature=${signature}`;
  }

  /**
   * Vérifie qu'une URL signée est valide
   */
  verifySignedUrl(filename: string, expires: number, signature: string): boolean {
    // Vérifier l'expiration
    if (Date.now() > expires) {
      return false;
    }

    // Vérifier la signature
    const expectedSignature = this.generateSignature(filename, expires);
    return signature === expectedSignature;
  }

  /**
   * Génère une signature pour sécuriser les URLs
   */
  private generateSignature(filename: string, timestamp: number): string {
    const secret = this.configService.get<string>('JWT_SECRET') || 'secret';
    const data = `${filename}:${timestamp}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Génère un nom de fichier unique
   */
  private generateFilename(prefix: string, originalName: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    return `${prefix}_${timestamp}_${random}${ext}`;
  }

  /**
   * Marque une photo comme vue
   */
  async markPhotoAsViewed(mediaId: string): Promise<void> {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    // Si c'est une photo en mode "once", supprimer les données binaires
    if (media.viewMode === PhotoViewMode.ONCE) {
      await this.mediaRepository.update(mediaId, {
        viewed: true,
        viewedAt: new Date(),
        fileData: null, // Supprimer les données binaires de la base
      });
      this.logger.log(`🗑️  Once photo data deleted after viewing: ${mediaId}`);
    } else {
      await this.mediaRepository.update(mediaId, {
        viewed: true,
        viewedAt: new Date(),
      });
      this.logger.log(`👁️  Photo marked as viewed: ${mediaId}`);
    }
  }

  /**
   * Récupère le chemin complet d'un fichier (legacy, pour compatibilité)
   */
  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  /**
   * Récupère un média par son filename depuis la base de données
   */
  async getMediaByFilename(filename: string): Promise<MessageMedia | null> {
    return this.mediaRepository.findOne({
      where: { filePath: filename },
    });
  }

  /**
   * Accepte un média avec contenu sensible
   */
  async acceptMedia(mediaId: string, userId: string): Promise<void> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ['message'],
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    // Vérifier que c'est bien le destinataire
    if (media.message.receiverId !== userId) {
      throw new BadRequestException('Only receiver can accept media');
    }

    await this.mediaRepository.update(mediaId, {
      receiverStatus: MediaReceiverStatus.ACCEPTED,
      receiverDecisionAt: new Date(),
    });

    this.logger.log(`✅ Media accepted by receiver: ${mediaId}`);
  }

  /**
   * Rejette un média avec contenu sensible
   */
  async rejectMedia(mediaId: string, userId: string): Promise<MessageMedia> {
    const media = await this.mediaRepository.findOne({
      where: { id: mediaId },
      relations: ['message'],
    });

    if (!media) {
      throw new BadRequestException('Media not found');
    }

    // Vérifier que c'est bien le destinataire
    if (media.message.receiverId !== userId) {
      throw new BadRequestException('Only receiver can reject media');
    }

    await this.mediaRepository.update(mediaId, {
      receiverStatus: MediaReceiverStatus.REJECTED,
      receiverDecisionAt: new Date(),
    });

    this.logger.warn(`❌ Media rejected by receiver: ${mediaId}`);

    return media;
  }

  /**
   * Supprime un média
   */
  async deleteMedia(mediaId: string): Promise<void> {
    const media = await this.mediaRepository.findOne({ where: { id: mediaId } });
    if (!media) {
      return;
    }

    // Supprimer l'entrée en base (les données binaires seront automatiquement supprimées)
    await this.mediaRepository.delete(mediaId);
    this.logger.log(`🗑️  Media deleted from database: ${mediaId}`);
  }
}
