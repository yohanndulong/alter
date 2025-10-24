import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    
    // Email FROM configurable via .env
    const fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'Alter';
    const fromAddress = this.configService.get<string>('EMAIL_FROM_ADDRESS') || 'noreply@alter.app';
    this.fromEmail = `${fromName} <${fromAddress}>`;
  }

  /**
   * Envoie un code de vérification par email
   */
  async sendVerificationCode(email: string, code: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Votre code de vérification Alter - ${code}`,
        html: this.getVerificationEmailTemplate(code),
      });

      this.logger.log(`Verification code sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}:`, error);
      throw new Error('Failed to send verification email');
    }
  }

  /**
   * Template HTML pour l'email de vérification
   */
  private getVerificationEmailTemplate(code: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border-radius: 10px;
              padding: 40px;
              text-align: center;
            }
            .code {
              background: white;
              color: #667eea;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              padding: 20px;
              border-radius: 8px;
              margin: 30px 0;
              font-family: 'Courier New', monospace;
            }
            .content {
              color: white;
              font-size: 16px;
            }
            h1 {
              color: white;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Bienvenue sur Alter</h1>
            <p class="content">Votre code de vérification est :</p>
            <div class="code">${code}</div>
            <p class="content">Ce code est valide pendant 10 minutes.</p>
            <p class="content" style="font-size: 14px; margin-top: 30px;">
              Si vous n'avez pas demandé ce code, ignorez cet email.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Bienvenue sur Alter !',
        html: `
          <h1>Bienvenue ${name} !</h1>
          <p>Nous sommes ravis de vous accueillir sur Alter.</p>
          <p>Commencez à explorer et à faire de belles rencontres !</p>
        `,
      });

      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      // Don't throw - welcome email is not critical
    }
  }
}
