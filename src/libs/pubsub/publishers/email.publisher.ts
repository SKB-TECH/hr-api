import { Injectable } from '@nestjs/common';
import { PubSubService } from '../pubsub.service';
import { PubSubTopic } from '../enums/topic.enum';

@Injectable()
export class EmailPublisher {
  constructor(private readonly pubSubService: PubSubService) {}

  async publishOtpEmail(email: string, otp: string) {
    return this.pubSubService.publish(PubSubTopic.EMAIL_QUEUE, 'otp', {
      email,
      otp,
    });
  }

  async publishWelcomeEmail(email: string, fullName: string) {
    return this.pubSubService.publish(PubSubTopic.EMAIL_QUEUE, 'welcome', {
      email,
      fullName,
    });
  }

  async publishPasswordResetEmail(email: string, otp: string) {
    return this.pubSubService.publish(
      PubSubTopic.EMAIL_QUEUE,
      'password-reset',
      { email, otp },
    );
  }

  async publishPasswordChangedEmail(email: string, fullName: string) {
    return this.pubSubService.publish(
      PubSubTopic.EMAIL_QUEUE,
      'password-changed',
      { email, fullName },
    );
  }
}
