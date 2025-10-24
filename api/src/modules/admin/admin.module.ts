import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { TestDataService } from './test-data.service';
import { User } from '../users/entities/user.entity';
import { Match } from '../matching/entities/match.entity';
import { Like } from '../matching/entities/like.entity';
import { Message } from '../chat/entities/message.entity';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Match, Like, Message]),
    EmbeddingsModule,
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [TestDataService],
  exports: [TestDataService],
})
export class AdminModule {}
