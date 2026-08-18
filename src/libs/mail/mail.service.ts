import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '../env/config.service';
import { EmailContent } from './templates/email-content.interface';
import { otpTemplate } from './templates/otp.template';
import { welcomeTemplate } from './templates/welcome.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { passwordChangedTemplate } from './templates/password-changed.template';
import { companyInvitationTemplate } from './templates/company-invitation.template';
import { applicationReviewingTemplate } from './templates/application-reviewing.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend?: Resend;
  private readonly from: string;
  private readonly logoUrl: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get('RESEND_API_KEY');
    this.from = this.config.get('RESEND_FROM_EMAIL') || 'noreply@hr-api.local';
    const webAppUrl = (this.config.get('WEB_APP_URL') || '').replace(/\/$/, '');
    this.logoUrl =
      this.config.get('EMAIL_LOGO_URL') || `${webAppUrl}/logo/lgo.png`;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    await this.send(to, otpTemplate(otp, this.logoUrl));
  }

  async sendWelcomeEmail(to: string, fullName: string) {
    await this.send(to, welcomeTemplate(fullName, this.logoUrl));
  }

  async sendPasswordResetEmail(to: string, otp: string) {
    await this.send(to, passwordResetTemplate(otp, this.logoUrl));
  }

  async sendPasswordChangedEmail(to: string, fullName: string) {
    await this.send(to, passwordChangedTemplate(fullName, this.logoUrl));
  }

  async sendCompanyInvitation(
    to: string,
    companyName: string,
    inviterName: string,
    acceptUrl: string,
  ) {
    await this.send(
      to,
      companyInvitationTemplate(
        companyName,
        inviterName,
        acceptUrl,
        this.logoUrl,
      ),
    );
  }

  async sendApplicationReviewingEmail(to: string, fullName: string) {
    await this.send(to, applicationReviewingTemplate(fullName, this.logoUrl));
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
