import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { SendCodeDto } from './dto/send-code.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('send-code')
  async sendCode(@Body() sendCodeDto: SendCodeDto): Promise<{ message: string }> {
    await this.authService.sendVerificationCode(sendCodeDto.email);
    return { message: 'Code de vérification envoyé par email' };
  }

  @Post('login')
  async login(@Body() verifyCodeDto: VerifyCodeDto): Promise<{ token: string; user: User }> {
    return this.authService.verifyCodeAndLogin(verifyCodeDto.email, verifyCodeDto.code);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: User): Promise<any> {
    return this.usersService.getUserWithPhotosUrls(user.id);
  }
}
