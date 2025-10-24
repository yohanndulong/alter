import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AlterMessage } from './entities/alter-message.entity';
import { AlterChatService } from './alter-chat.service';
import { AlterChatController } from './alter-chat.controller';
import { AlterChatGateway } from './alter-chat.gateway';
import { LlmModule } from '../llm/llm.module';
import { UsersModule } from '../users/users.module';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlterMessage]),
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
    LlmModule,
    UsersModule,
    EmbeddingsModule,
  ],
  controllers: [AlterChatController],
  providers: [AlterChatService, AlterChatGateway],
  exports: [AlterChatService],
})
export class AlterChatModule {}
