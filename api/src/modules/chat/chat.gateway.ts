import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { MediaService } from './media.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Match } from '../matching/entities/match.entity';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat'
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly mediaService: MediaService,
    private readonly jwtService: JwtService,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {
    // S'enregistrer auprès du MediaService pour les notifications
    this.mediaService.setGateway(this);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extraire le token du handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      console.log(`Chat - Connection attempt from ${client.id}`);
      console.log(`Chat - Token present:`, !!token);

      if (!token) {
        console.log(`Chat - Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Vérifier le token
      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub; // Attacher l'userId au socket

      // Join user-specific room for targeted messages
      client.join(`user-${client.userId}`);

      console.log(`Chat - Token verified successfully`);
      console.log(`Chat - Client connected: ${client.id} (userId: ${client.userId})`);
    } catch (error) {
      console.log(`Chat - Connection rejected: Invalid token`);
      console.log(`Chat - Error details:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Chat - Client disconnected: ${client.id} (userId: ${client.userId})`);
  }

  @SubscribeMessage('join-match')
  handleJoinMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() matchId: string,
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    client.join(`match-${matchId}`);
    console.log(`User ${client.userId} joined match ${matchId}`);
    return { event: 'joined-match', matchId };
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: {
      matchId: string;
      content: string;
    },
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Récupérer le match pour déterminer le receiverId de manière sécurisée
    const match = await this.matchRepository.findOne({
      where: [
        { id: payload.matchId, userId: client.userId },
        { id: payload.matchId, matchedUserId: client.userId },
      ],
    });

    if (!match) {
      this.logger.error(`❌ Match ${payload.matchId} not found or user ${client.userId} not authorized`);
      throw new UnauthorizedException('Match not found or unauthorized');
    }

    // Déterminer automatiquement le receiverId (l'autre utilisateur du match)
    const receiverId = match.userId === client.userId
      ? match.matchedUserId
      : match.userId;

    this.logger.log(`📤 Message: ${client.userId} → ${receiverId} (match: ${payload.matchId})`);

    // Envoyer le message avec le receiverId déterminé côté serveur
    const message = await this.chatService.sendMessage(
      payload.matchId,
      client.userId, // userId authentifié depuis le JWT
      receiverId, // Déterminé automatiquement côté serveur
      payload.content,
    );

    // Emit to match room (for users who are in the room)
    this.server.to(`match-${payload.matchId}`).emit('message', message);

    // Emit to receiver's user room to ensure delivery even if not in match room
    // DON'T emit to sender's user room to avoid duplicates (sender is in match room)
    this.server.to(`user-${receiverId}`).emit('message', message);

    return message;
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string; isTyping: boolean },
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Broadcast typing indicator avec l'userId du JWT
    client.to(`match-${payload.matchId}`).emit('user-typing', {
      userId: client.userId, // userId authentifié depuis le JWT
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage('message-delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string; messageId: string },
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Enregistrer en base de données
    await this.messageRepository.update(
      { id: payload.messageId },
      { delivered: true, deliveredAt: new Date() }
    );

    // Notifier l'autre utilisateur que le message a été livré
    client.to(`match-${payload.matchId}`).emit('message:delivered', {
      messageId: payload.messageId,
      deliveredTo: client.userId,
    });
  }

  @SubscribeMessage('message-read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { matchId: string; messageId: string },
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Marquer comme lu en base de données avec la date
    await this.messageRepository.update(
      { matchId: payload.matchId, receiverId: client.userId, read: false },
      { read: true, readAt: new Date() }
    );

    // Notifier TOUS les utilisateurs (y compris celui qui lit) pour synchroniser les compteurs
    this.server.to(`match-${payload.matchId}`).emit('message:read', {
      matchId: payload.matchId,
      readBy: client.userId,
    });
  }
}
