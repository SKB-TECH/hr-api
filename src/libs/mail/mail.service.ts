import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '../env/config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend?: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get('RESEND_API_KEY');
    this.from = this.config.get('RESEND_FROM_EMAIL') || 'noreply@hr-api.local';
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    await this.send(
      to,
      'Your verification code',
      `<p>Your verification code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    );
  }

  async sendWelcomeEmail(to: string, fullName: string) {
    await this.send(
      to,
      'Welcome',
      `<p>Welcome, ${fullName}! Your account is ready.</p>`,
    );
  }

  async sendPasswordResetEmail(to: string, otp: string) {
    await this.send(
      to,
      'Reset your password',
      `<p>Your password reset code is <b>${otp}</b>. It expires in 10 minutes.</p>`,
    );
  }

  async sendPasswordChangedEmail(to: string, fullName: string) {
    await this.send(
      to,
      'Your password was changed',
      `<p>Hi ${fullName}, your account password was just changed. If this wasn't you, contact support.</p>`,
    );
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.log(`[MAIL:dev] to=${to} subject="${subject}"\n${html}`);
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }
  }
}
