import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '../env/config.service';
import { EmailContent } from './templates/email-content.interface';
import { otpTemplate } from './templates/otp.template';
import { welcomeTemplate } from './templates/welcome.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { passwordChangedTemplate } from './templates/password-changed.template';

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
    await this.send(to, otpTemplate(otp));
  }

  async sendWelcomeEmail(to: string, fullName: string) {
    await this.send(to, welcomeTemplate(fullName));
  }

  async sendPasswordResetEmail(to: string, otp: string) {
    await this.send(to, passwordResetTemplate(otp));
  }

  async sendPasswordChangedEmail(to: string, fullName: string) {
    await this.send(to, passwordChangedTemplate(fullName));
  }

  async sendCompanyInvitation(
    to: string,
    companyName: string,
    inviterName: string,
    acceptUrl: string,
  ) {
    const escape = (value: string) =>
      value.replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        };
        return entities[character];
      });
    await this.send(to, {
      subject: `Invitation to join ${companyName}`,
      html: `<p>${escape(inviterName)} invited you to join <strong>${escape(companyName)}</strong>.</p><p><a href="${escape(acceptUrl)}">Accept invitation</a></p><p>This link expires in 7 days.</p>`,
    });
  }

  private async send(to: string, { subject, html }: EmailContent) {
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
