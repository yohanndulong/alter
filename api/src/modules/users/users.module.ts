import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { User } from './entities/user.entity';
import { Photo } from './entities/photo.entity';
import { Match } from '../matching/entities/match.entity';
import { Like } from '../matching/entities/like.entity';
import { Pass } from '../matching/entities/pass.entity';
import { Message } from '../chat/entities/message.entity';
import { AlterMessage } from '../alter-chat/entities/alter-message.entity';
import { UsersService } from './users.service';
import { PhotosService } from './photos.service';
import { UsersController } from './users.controller';
import { PhotosController } from './photos.controller';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Photo, Match, Like, Pass, Message, AlterMessage]),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    forwardRef(() => MatchingModule),
  ],
  controllers: [UsersController, PhotosController],
  providers: [UsersService, PhotosService],
  exports: [UsersService, PhotosService],
})
export class UsersModule {}
