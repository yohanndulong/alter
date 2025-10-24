import { Controller, Get, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: User): Promise<any> {
    return this.usersService.getUserWithPhotosUrls(user.id);
  }

  @Put('me')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    return this.usersService.update(user.id, updateProfileDto);
  }

  @Delete('me')
  async deleteAccount(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.usersService.deleteAccount(user.id);
    return { message: 'Account deleted successfully' };
  }
}
