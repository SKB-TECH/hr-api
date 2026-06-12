import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PubSub, Subscription, Topic } from '@google-cloud/pubsub';
import { ConfigService } from '../env/config.service';
import { RedisService } from '../redis/redis.service';
import { PubSubTopic } from './enums/topic.enum';
import { PubSubMessage } from './interfaces/pubsub-message.interface';
import { MessageHandler } from './types/message-handler.type';

const DEDUP_TTL = 300;

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PubSubService.name);
  private client!: PubSub;
  private env!: string;
  private enabled = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  isEnabled(): boolean {
    return this.enabled;
  }

  onModuleInit() {
    this.env = this.configService.get('NODE_ENV') || 'local';

    const flag = this.configService.get('PUBSUB_ENABLED');
    this.enabled =
      flag !== undefined && flag !== null && flag !== ''
        ? flag === 'true'
        : this.env !== 'local';

    if (!this.enabled) {
      this.logger.log(`Pub/Sub disabled (env: ${this.env})`);
      return;
    }

    const projectId = this.configService.get('PUBSUB_PROJECT_ID');
    const keyFile = this.configService.get('PUBSUB_KEY_FILE');

    const options: ConstructorParameters<typeof PubSub>[0] = { projectId };
    if (keyFile) {
      options.keyFilename = keyFile;
    }

    this.client = new PubSub(options);
    this.logger.log(
      `Pub/Sub initialized — project: ${projectId}, env: ${this.env}`,
    );
  }

  private withEnv(name: string): string {
    return `${name}-${this.env}`;
  }

  async onModuleDestroy() {
    for (const sub of this.subscriptions) {
      sub.close();
    }
  }

  async publish<T>(
    topicName: PubSubTopic | string,
    type: string,
    data: T,
  ): Promise<string> {
    if (!this.enabled) return '';

    const fullTopic = this.withEnv(topicName);
    const message: PubSubMessage<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    await this.ensureTopic(fullTopic);
    const topic = this.client.topic(fullTopic);
    const messageId = await topic.publishMessage({
      json: message,
    });

    this.logger.debug(`Published to ${fullTopic}: ${type} (${messageId})`);
    return messageId;
  }

  async subscribe<T>(
    topicName: string,
    subscriptionName: string,
    handler: MessageHandler<T>,
    dlqOptions?: {
      deadLetterTopic: string;
      maxDeliveryAttempts?: number;
    },
  ): Promise<void> {
    if (!this.enabled) {
      this.logger.log(
        `Pub/Sub disabled — skipping subscription ${subscriptionName}`,
      );
      return;
    }

    const fullTopic = this.withEnv(topicName);
    const fullSub = this.withEnv(subscriptionName);

    await this.ensureTopic(fullTopic);

    const subOptions = dlqOptions
      ? {
          deadLetterTopic: this.withEnv(dlqOptions.deadLetterTopic),
          maxDeliveryAttempts: dlqOptions.maxDeliveryAttempts || 5,
        }
      : undefined;

    if (subOptions) {
      await this.ensureTopic(subOptions.deadLetterTopic);
    }

    await this.ensureSubscription(fullTopic, fullSub, subOptions);

    const subscription = this.client.subscription(fullSub);
    this.subscriptions.push(subscription);

    subscription.on('message', async (message) => {
      try {
        const dedupKey = `pubsub:dedup:${fullSub}:${message.id}`;
        const isNew = await this.redisService.setNx(dedupKey, '1', DEDUP_TTL);
        if (!isNew) {
          message.ack();
          return;
        }

        const parsed = JSON.parse(message.data.toString()) as PubSubMessage<T>;
        await handler(parsed);
        message.ack();
      } catch (error) {
        this.logger.error(
          `Error processing message from ${subscriptionName}`,
          error instanceof Error ? error.stack : error,
        );
        message.nack();
      }
    });

    subscription.on('error', (error) => {
      this.logger.error(`Subscription error on ${subscriptionName}`, error);
    });

    this.logger.log(`Subscribed to ${subscriptionName}`);
  }

  async ensureTopic(topicName: string): Promise<Topic> {
    const topic = this.client.topic(topicName);
    const [exists] = await topic.exists();
    if (!exists) {
      const [created] = await this.client.createTopic(topicName);
      this.logger.log(`Created topic: ${topicName}`);
      return created;
    }
    return topic;
  }

  async ensureSubscription(
    topicName: string,
    subscriptionName: string,
    options?: {
      deadLetterTopic?: string;
      maxDeliveryAttempts?: number;
      ackDeadlineSeconds?: number;
      retryMinBackoff?: number;
      retryMaxBackoff?: number;
    },
  ): Promise<Subscription> {
    const subscription = this.client.subscription(subscriptionName);
    const [exists] = await subscription.exists();
    if (!exists) {
      const config: any = {
        deadLetterPolicy: options?.deadLetterTopic
          ? {
              deadLetterTopic: `projects/${this.configService.get('PUBSUB_PROJECT_ID')}/topics/${options.deadLetterTopic}`,
              maxDeliveryAttempts: options?.maxDeliveryAttempts || 5,
            }
          : undefined,
        ackDeadlineSeconds: options?.ackDeadlineSeconds || 60,
        retryPolicy: {
          minimumBackoff: { seconds: options?.retryMinBackoff || 10 },
          maximumBackoff: { seconds: options?.retryMaxBackoff || 600 },
        },
      };

      await this.client
        .topic(topicName)
        .createSubscription(subscriptionName, config);
      this.logger.log(`Created subscription: ${subscriptionName}`);
      return this.client.subscription(subscriptionName);
    }
    return subscription;
  }
}
