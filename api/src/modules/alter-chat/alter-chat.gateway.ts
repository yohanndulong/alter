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
import { UnauthorizedException } from '@nestjs/common';
import { AlterChatService } from './alter-chat.service';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/alter-chat'
})
export class AlterChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly alterChatService: AlterChatService,
    private readonly jwtService: JwtService,
  ) {
    // S'enregistrer auprès du service pour éviter la dépendance circulaire
    this.alterChatService.setGateway(this);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extraire le token du handshake
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      console.log(`Alter Chat - Connection attempt from ${client.id}`);
      console.log(`Alter Chat - Token present:`, !!token);
      console.log(`Alter Chat - Token preview:`, token ? `${token.substring(0, 20)}...` : 'none');

      if (!token) {
        console.log(`Alter Chat - Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Vérifier le token
      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub; // Attacher l'userId au socket

      console.log(`Alter Chat - Token verified successfully`);
      console.log(`Alter Chat - Payload:`, payload);
      console.log(`Alter Chat - Client connected: ${client.id} (userId: ${client.userId})`);
    } catch (error) {
      console.log(`Alter Chat - Connection rejected: Invalid token`);
      console.log(`Alter Chat - Error details:`, error.message);
      console.log(`Alter Chat - Error name:`, error.name);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Alter Chat - Client disconnected: ${client.id} (userId: ${client.userId})`);
  }

  @SubscribeMessage('join-alter-chat')
  handleJoinAlterChat(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    client.join(`alter-chat-${client.userId}`);
    console.log(`User ${client.userId} joined alter-chat`);
    return { event: 'joined-alter-chat', userId: client.userId };
  }

  @SubscribeMessage('send-alter-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { content: string },
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const { content } = payload;

    // Envoie le message utilisateur immédiatement
    this.server.to(`alter-chat-${client.userId}`).emit('alter-message', {
      role: 'user',
      content,
      timestamp: new Date(),
    });

    // Génère la réponse d'Alter avec l'userId du JWT
    const alterResponse = await this.alterChatService.sendMessage(client.userId, content);

    // Envoie la réponse d'Alter avec TOUS les champs nécessaires
    this.server.to(`alter-chat-${client.userId}`).emit('alter-message', {
      id: alterResponse.id,
      role: 'assistant',
      content: alterResponse.content,
      options: alterResponse.options,
      selectionType: alterResponse.selectionType,
      structuredData: alterResponse.structuredData,
      profileState: alterResponse.profileState,
      timestamp: alterResponse.createdAt,
    });

    return alterResponse;
  }

  @SubscribeMessage('load-alter-history')
  async handleLoadHistory(
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    const messages = await this.alterChatService.getMessages(client.userId);
    client.emit('alter-history', messages);
    return messages;
  }
}
