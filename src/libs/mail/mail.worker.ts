import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PubSubService } from '../pubsub/pubsub.service';
import { PubSubTopic } from '../pubsub/enums/topic.enum';
import { MailService } from './mail.service';

@Injectable()
export class MailWorker implements OnModuleInit {
  private readonly logger = new Logger(MailWorker.name);

  constructor(
    private readonly pubSubService: PubSubService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    if (!this.pubSubService.isEnabled()) {
      this.logger.log('Pub/Sub disabled — mail worker idle');
      return;
    }

    try {
      await this.pubSubService.subscribe<any>(
        PubSubTopic.EMAIL_QUEUE,
        `${PubSubTopic.EMAIL_QUEUE}-worker`,
        (message) => this.handle(message.type, message.data),
        {
          deadLetterTopic: PubSubTopic.EMAIL_QUEUE_DLQ,
          maxDeliveryAttempts: 5,
        },
      );
    } catch {
      this.logger.warn('Mail worker subscription not available');
    }
  }

  private async handle(type: string, data: any): Promise<void> {
    switch (type) {
      case 'otp':
        await this.mailService.sendOtpEmail(data.email, data.otp);
        break;
      case 'welcome':
        await this.mailService.sendWelcomeEmail(data.email, data.fullName);
        break;
      case 'password-reset':
        await this.mailService.sendPasswordResetEmail(data.email, data.otp);
        break;
      case 'password-changed':
        await this.mailService.sendPasswordChangedEmail(
          data.email,
          data.fullName,
        );
        break;
      default:
        this.logger.warn(`Unknown email message type: ${type}`);
    }
  }
}
