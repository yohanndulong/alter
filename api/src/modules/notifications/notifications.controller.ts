import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  async registerToken(
    @CurrentUser() user: User,
    @Body() dto: RegisterTokenDto,
  ) {
    return this.notificationsService.registerToken(user.id, dto);
  }

  @Post('unregister-token')
  async unregisterToken(
    @CurrentUser() user: User,
    @Body() dto: RegisterTokenDto,
  ) {
    await this.notificationsService.unregisterToken(user.id, dto.token);
    return { success: true };
  }
}
