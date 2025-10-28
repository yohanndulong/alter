import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { MatchingModule } from './modules/matching/matching.module';
import { ChatModule } from './modules/chat/chat.module';
import { AlterChatModule } from './modules/alter-chat/alter-chat.module';
import { UploadModule } from './modules/upload/upload.module';
import { ParametersModule } from './modules/parameters/parameters.module';
import { LlmModule } from './modules/llm/llm.module';
import { EmailModule } from './modules/email/email.module';
import { EmbeddingsModule } from './modules/embeddings/embeddings.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { User } from './modules/users/entities/user.entity';
import { Photo } from './modules/users/entities/photo.entity';
import { Match } from './modules/matching/entities/match.entity';
import { Like } from './modules/matching/entities/like.entity';
import { Pass } from './modules/matching/entities/pass.entity';
import { CompatibilityCache } from './modules/matching/entities/compatibility-cache.entity';
import { Message } from './modules/chat/entities/message.entity';
import { MessageMedia } from './modules/chat/entities/message-media.entity';
import { AlterMessage } from './modules/alter-chat/entities/alter-message.entity';
import { OnboardingQuestion } from './modules/onboarding/entities/onboarding-question.entity';
import { Parameter } from './modules/parameters/entities/parameter.entity';
import { FcmToken } from './modules/notifications/entities/fcm-token.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');

        if (databaseUrl) {
          // Utiliser DATABASE_URL si disponible
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [User, Photo, Match, Like, Pass, CompatibilityCache, Message, MessageMedia, AlterMessage, OnboardingQuestion, Parameter, FcmToken],
            synchronize: configService.get('NODE_ENV') === 'development',
            logging: false, // Logs SQL désactivés
            timezone: 'UTC', // Stocker toutes les dates en UTC
            extra: {
              timezone: 'UTC',
            },
          };
        }

        // Fallback sur les variables individuelles (rétrocompatibilité)
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [User, Photo, Match, Like, Pass, Message, MessageMedia, AlterMessage, OnboardingQuestion, Parameter, FcmToken],
          synchronize: configService.get('NODE_ENV') === 'development',
          logging: false, // Logs SQL désactivés
          timezone: 'UTC', // Stocker toutes les dates en UTC
          extra: {
            timezone: 'UTC',
          },
        };
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    OnboardingModule,
    MatchingModule,
    ChatModule,
    AlterChatModule,
    UploadModule,
    ParametersModule,
    LlmModule,
    EmailModule,
    EmbeddingsModule,
    AdminModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
