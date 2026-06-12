import { Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { pubClient } from './redis-client';

@Injectable()
export class RedisPublisherService {
  private readonly client: RedisClientType = pubClient;

  async publish(channel: string, payload: any): Promise<void> {
    if (this.client.isOpen) {
      await this.client.publish(channel, JSON.stringify(payload));
    }
  }
}
