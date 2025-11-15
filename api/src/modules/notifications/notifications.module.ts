import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { FcmToken } from './entities/fcm-token.entity';
import { Message } from '../chat/entities/message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FcmToken, Message])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
