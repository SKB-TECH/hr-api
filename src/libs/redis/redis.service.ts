import { Injectable } from '@nestjs/common';
import { pubClient, subClient } from './redis-client';

@Injectable()
export class RedisService {
  private client: any = pubClient;

  async ping(): Promise<string> {
    const c: any = this.client as any;
    if (typeof c.ping === 'function') {
      return await c.ping();
    }
    return await c.sendCommand(['PING']);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!keys?.length) return [];
    const c: any = this.client as any;

    if (typeof c.mGet === 'function') {
      return await c.mGet(keys);
    }

    if (typeof c.multi === 'function') {
      const pipeline = c.multi();
      for (const k of keys) {
        pipeline.get(k);
      }
      const execRes = await pipeline.exec();
      return (execRes || []).map((item: any) =>
        Array.isArray(item) ? (item[1] ?? null) : (item ?? null),
      );
    }

    return await Promise.all(keys.map((k) => this.get(k)));
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async set(key: string, value: string, ttl = 3600) {
    if (ttl && ttl > 0) {
      await this.client.set(key, value, { EX: ttl });
    } else {
      await this.client.set(key, value);
    }
  }

  async mset(
    items: { key: string; value: string }[],
    ttl = 3600,
  ): Promise<void> {
    if (!items?.length) return;
    const pipeline = this.client.multi();
    const useTtl = !!ttl && ttl > 0;
    for (const { key, value } of items) {
      if (useTtl) pipeline.set(key, value, { EX: ttl });
      else pipeline.set(key, value);
    }
    await pipeline.exec();
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async setNx(key: string, value: string, ttl: number): Promise<boolean> {
    const result = await this.client.set(key, value, { EX: ttl, NX: true });
    return result === 'OK';
  }

  async publish(channel: string, message: string): Promise<void> {
    await pubClient.publish(channel, message);
  }

  async subscribe(
    channel: string,
    handler: (message: string) => void,
  ): Promise<void> {
    await subClient.subscribe(channel, handler);
  }
}
