import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { subClient } from './redis-client';

@Injectable()
export class RedisSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(RedisSubscriberService.name);

  private readonly client: RedisClientType = subClient;

  async onModuleInit() {
    this.logger.debug('RedisSubscriberService initialized');
  }

  async subscribe(channel: string, callback: (parsed: any) => void) {
    await this.client.subscribe(channel, (raw) => {
      try {
        const parsed = JSON.parse(raw);
        callback(parsed);
      } catch (err) {
        this.logger.error(`Failed to parse Redis message: ${err.message}`);
      }
    });

    this.logger.log(`Subscribed to Redis channel: ${channel}`);
  }
}
