import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Message } from './entities/message.entity';
import { MessageMedia } from './entities/message-media.entity';
import { Match } from '../matching/entities/match.entity';
import { User } from '../users/entities/user.entity';
import { ChatService } from './chat.service';
import { MediaService } from './media.service';
import { ModerationService } from './moderation.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from '../users/users.module';
import { LlmModule } from '../llm/llm.module';
import { ParametersModule } from '../parameters/parameters.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, MessageMedia, Match, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
    UsersModule,
    LlmModule,
    ParametersModule,
    NotificationsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, MediaService, ModerationService, ChatGateway],
  exports: [ChatService, MediaService],
})
export class ChatModule {}
