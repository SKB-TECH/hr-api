import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { RedisService } from '@/libs/redis/redis.service';

@Injectable()
export class AiOperationCoordinator {
  constructor(private readonly redis: RedisService) {}

  async run<T>(
    operation: string,
    userId: string,
    entityId: string,
    idempotencyKey: string | undefined,
    callback: () => Promise<T>,
  ): Promise<T> {
    if (!idempotencyKey || !isUUID(idempotencyKey, '4'))
      throw new BadRequestException('idempotency-key must be a UUID v4');
    const lock = `ai:idempotency:${operation}:${userId}:${entityId}:${idempotencyKey}`;
    let acquired: boolean;
    try {
      acquired = await this.redis.setNx(lock, 'processing', 300);
    } catch {
      throw new ServiceUnavailableException(
        'AI request coordination is unavailable',
      );
    }
    if (!acquired)
      throw new ConflictException('This AI request is already processing');
    try {
      return await callback();
    } catch (error) {
      try {
        await this.redis.del(lock);
      } catch {
        // The lock expires automatically; preserve the primary failure.
      }
      throw error;
    }
  }
}
