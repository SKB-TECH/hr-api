import { Injectable } from '@nestjs/common';
import { pubClient } from './redis-client';

@Injectable()
export class RedisService {
  private client: any = pubClient;

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl = 3600) {
    if (ttl && ttl > 0) {
      await this.client.set(key, value, { EX: ttl });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async setNx(key: string, value: string, ttl: number): Promise<boolean> {
    const result = await this.client.set(key, value, { EX: ttl, NX: true });
    return result === 'OK';
  }
}
