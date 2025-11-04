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
import { UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

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

  constructor(
    private readonly chatService: ChatService,
    private readonly mediaService: MediaService,
    private readonly jwtService: JwtService,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
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
      receiverId: string;
      content: string;
    },
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Utiliser l'userId du token JWT, pas celui du payload
    const message = await this.chatService.sendMessage(
      payload.matchId,
      client.userId, // userId authentifié depuis le JWT
      payload.receiverId,
      payload.content,
    );

    // Broadcast le message à tous les clients dans ce match
    this.server.to(`match-${payload.matchId}`).emit('message', message);

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
