import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  // Email de test pour Google Play Store - code fixe pour bypass
  private readonly BYPASS_EMAIL = 'gp-internal-d4f7b2c9e1a8@alterapp-test.review';
  private readonly BYPASS_CODE = '999999';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Génère un code de vérification à 6 chiffres
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Envoie un code de vérification par email
   */
  async sendVerificationCode(email: string): Promise<void> {
    // Utilise le code de bypass pour l'email de test Google Play
    const code = email === this.BYPASS_EMAIL ? this.BYPASS_CODE : this.generateVerificationCode();
    const expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10); // Code valide 10 minutes

    // Cherche ou crée l'utilisateur
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.create({
        email,
        verificationCode: code,
        verificationCodeExpiry: expiryDate,
      });
    } else {
      await this.usersService.update(user.id, {
        verificationCode: code,
        verificationCodeExpiry: expiryDate,
      });
    }

    // N'envoie pas d'email pour le compte de test Google Play
    if (email !== this.BYPASS_EMAIL) {
      await this.emailService.sendVerificationCode(email, code);
    }
  }

  /**
   * Vérifie le code et connecte l'utilisateur
   */
  async verifyCodeAndLogin(email: string, code: string): Promise<{ token: string; user: User }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Vérifie le code
    if (user.verificationCode !== code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Vérifie l'expiration
    if (new Date() > user.verificationCodeExpiry) {
      throw new BadRequestException('Verification code has expired');
    }

    // Marque l'email comme vérifié et nettoie le code
    await this.usersService.update(user.id, {
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
      lastActiveAt: new Date(),
    });

    // Recharge l'utilisateur avec photos
    const updatedUser = await this.usersService.getUserWithPhotosUrls(user.id);

    // Génère le token JWT
    const token = this.jwtService.sign({ sub: updatedUser.id, email: updatedUser.email });

    return { token, user: updatedUser };
  }

  /**
   * Valide le token JWT et retourne l'utilisateur avec photos
   */
  async validateUser(userId: string): Promise<any> {
    return this.usersService.getUserWithPhotosUrls(userId);
  }
}
