import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
  Res,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { MediaService } from './media.service';
import { ChatGateway } from './chat.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../matching/entities/match.entity';
import { PhotoViewMode } from './entities/message-media.entity';
import { Message, MessageType } from './entities/message.entity';

@Controller('chat/matches')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly mediaService: MediaService,
    private readonly chatGateway: ChatGateway,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  private validateUuid(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException(`Invalid match ID format: ${id}`);
    }
  }

  @Get(':matchId/messages')
  async getMessages(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
  ) {
    this.validateUuid(matchId);

    // Vérifier que l'utilisateur fait partie de ce match (userId OU matchedUserId)
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId: user.id, isActive: true },
        { id: matchId, matchedUserId: user.id, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found or access denied');
    }

    return this.chatService.getMessages(matchId);
  }

  @Post(':matchId/messages')
  async sendMessage(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
    @Body('content') content: string,
  ) {
    this.validateUuid(matchId);

    // Get match to find receiverId (check both userId and matchedUserId)
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId: user.id, isActive: true },
        { id: matchId, matchedUserId: user.id, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Determine receiver based on who the current user is in the match
    const receiverId = match.userId === user.id ? match.matchedUserId : match.userId;

    return this.chatService.sendMessage(
      matchId,
      user.id,
      receiverId,
      content,
    );
  }

  @Post(':matchId/read')
  async markAsRead(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
  ) {
    this.validateUuid(matchId);
    await this.chatService.markAsRead(matchId, user.id);
    return { message: 'Messages marked as read' };
  }

  /**
   * Upload d'un message vocal
   */
  @Post(':matchId/voice')
  @UseInterceptors(FileInterceptor('audio'))
  async sendVoiceMessage(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('duration') duration?: string,
  ) {
    this.validateUuid(matchId);

    if (!file) {
      throw new BadRequestException('Audio file is required');
    }

    // Vérifier que l'utilisateur fait partie du match (userId OU matchedUserId)
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId: user.id, isActive: true },
        { id: matchId, matchedUserId: user.id, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Determine receiver based on who the current user is in the match
    const receiverId = match.userId === user.id ? match.matchedUserId : match.userId;

    // Créer le message
    const message = this.messageRepository.create({
      matchId,
      senderId: user.id,
      receiverId,
      type: MessageType.VOICE,
      delivered: true,
      deliveredAt: new Date(),
    });

    const savedMessage = await this.messageRepository.save(message);

    // Upload du fichier audio
    const media = await this.mediaService.uploadVoiceMessage(
      savedMessage.id,
      file,
      duration ? parseInt(duration) : undefined,
    );

    // Générer l'URL signée
    const url = this.mediaService.generateSignedUrl(media.filePath);

    const response = {
      ...savedMessage,
      media: {
        ...media,
        url,
      },
    };

    // Émettre le message via WebSocket
    this.chatGateway.server.to(`match-${matchId}`).emit('message', response);

    return response;
  }

  /**
   * Upload d'un message photo
   */
  @Post(':matchId/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async sendPhotoMessage(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isReel') isReel?: string,
    @Body('viewMode') viewMode?: PhotoViewMode,
    @Body('viewDuration') viewDuration?: string,
  ) {
    this.validateUuid(matchId);

    if (!file) {
      throw new BadRequestException('Photo file is required');
    }

    // Vérifier que l'utilisateur fait partie du match (userId OU matchedUserId)
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId: user.id, isActive: true },
        { id: matchId, matchedUserId: user.id, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Determine receiver based on who the current user is in the match
    const receiverId = match.userId === user.id ? match.matchedUserId : match.userId;

    // Créer le message
    const message = this.messageRepository.create({
      matchId,
      senderId: user.id,
      receiverId,
      type: MessageType.PHOTO,
      delivered: true,
      deliveredAt: new Date(),
    });

    const savedMessage = await this.messageRepository.save(message);

    // Upload de la photo (l'analyse NSFW sera faite côté client)
    const media = await this.mediaService.uploadPhotoMessage(
      savedMessage.id,
      file,
      {
        isReel: isReel === 'true',
        viewMode: viewMode || PhotoViewMode.UNLIMITED,
        viewDuration: viewDuration ? parseInt(viewDuration) : undefined,
      },
      matchId,
    );

    // Générer l'URL signée
    const url = this.mediaService.generateSignedUrl(media.filePath);

    const response = {
      ...savedMessage,
      media: {
        ...media,
        url,
        processingStatus: media.processingStatus,
      },
    };

    // Émettre le message via WebSocket
    this.chatGateway.server.to(`match-${matchId}`).emit('message', response);

    return response;
  }

  /**
   * Analyser la qualité d'une conversation
   */
  @Get(':matchId/quality')
  async analyzeQuality(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
  ) {
    this.validateUuid(matchId);

    // Vérifier que l'utilisateur fait partie du match (userId OU matchedUserId)
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId: user.id, isActive: true },
        { id: matchId, matchedUserId: user.id, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return this.chatService.analyzeConversationQuality(matchId);
  }

  /**
   * Génère des suggestions de sujets de conversation
   */
  @Get(':matchId/suggestions')
  async getConversationSuggestions(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
  ) {
    // Vérifier que le match existe et appartient à l'utilisateur
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId: user.id, isActive: true },
        { id: matchId, matchedUserId: user.id, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    return this.chatService.generateConversationSuggestions(matchId, user.id);
  }

  /**
   * Marquer une photo comme vue
   */
  @Post(':matchId/media/:mediaId/view')
  async markMediaAsViewed(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
    @Param('mediaId') mediaId: string,
  ) {
    this.validateUuid(matchId);
    this.validateUuid(mediaId);

    // Vérifier que l'utilisateur fait partie du match (userId OU matchedUserId)
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId: user.id, isActive: true },
        { id: matchId, matchedUserId: user.id, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    await this.mediaService.markPhotoAsViewed(mediaId);

    return { message: 'Media marked as viewed' };
  }

  /**
   * Accepter une photo avec contenu sensible
   */
  @Post(':matchId/media/:mediaId/accept')
  async acceptMedia(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
    @Param('mediaId') mediaId: string,
  ) {
    this.validateUuid(matchId);
    this.validateUuid(mediaId);

    // Vérifier que l'utilisateur fait partie du match
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId: user.id, isActive: true },
        { id: matchId, matchedUserId: user.id, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    await this.mediaService.acceptMedia(mediaId, user.id);

    // Notifier via WebSocket que le média a été accepté
    this.chatGateway.server.to(`match-${matchId}`).emit('media:accepted', {
      mediaId,
      matchId,
      acceptedBy: user.id,
    });

    return { message: 'Media accepted' };
  }

  /**
   * Refuser une photo avec contenu sensible
   */
  @Post(':matchId/media/:mediaId/reject')
  async rejectMedia(
    @CurrentUser() user: User,
    @Param('matchId') matchId: string,
    @Param('mediaId') mediaId: string,
  ) {
    this.validateUuid(matchId);
    this.validateUuid(mediaId);

    // Vérifier que l'utilisateur fait partie du match
    const match = await this.matchRepository.findOne({
      where: [
        { id: matchId, userId: user.id, isActive: true },
        { id: matchId, matchedUserId: user.id, isActive: true },
      ],
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Rejeter le média
    const rejectedMedia = await this.chatService.rejectMedia(mediaId, user.id);

    // Notifier via WebSocket que le média a été rejeté
    this.chatGateway.server.to(`match-${matchId}`).emit('media:rejected', {
      mediaId,
      matchId,
      rejectedBy: user.id,
    });

    return { message: 'Media rejected' };
  }

  /**
   * Récupérer un fichier média (avec vérification de signature)
   */
  @Public()
  @Get('media/:filename')
  async getMedia(
    @Param('filename') filename: string,
    @Query('expires') expires: string,
    @Query('signature') signature: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Vérifier la signature
    const expiresNum = parseInt(expires);
    if (!this.mediaService.verifySignedUrl(filename, expiresNum, signature)) {
      throw new BadRequestException('Invalid or expired URL');
    }

    // Récupérer le média depuis la base de données
    const media = await this.mediaService.getMediaByFilename(filename);

    if (!media || !media.fileData) {
      throw new NotFoundException('Media not found or deleted');
    }

    res.set({
      'Content-Type': media.mimeType,
      'Content-Length': media.fileSize,
      'Cache-Control': 'private, max-age=3600',
    });

    return new StreamableFile(Buffer.from(media.fileData));
  }
}
