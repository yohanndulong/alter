import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { AlterChatService } from './alter-chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('chat/ai')
@UseGuards(JwtAuthGuard)
export class AlterChatController {
  constructor(private readonly alterChatService: AlterChatService) {}

  @Get('messages')
  async getMessages(@CurrentUser() user: User) {
    return this.alterChatService.getMessages(user.id);
  }

  @Post('messages')
  async sendMessage(
    @CurrentUser() user: User,
    @Body('content') content: string,
  ) {
    return this.alterChatService.sendMessage(user.id, content);
  }

  @Delete('reset')
  @UseGuards(AdminGuard)
  async resetChat(@CurrentUser() user: User) {
    await this.alterChatService.resetAlterChat(user.id);
    return { message: 'ALTER chat reset successfully' };
  }

  @Get('share-message')
  async generateShareMessage(@CurrentUser() user: User) {
    return this.alterChatService.generateShareMessage(user.id);
  }
}
