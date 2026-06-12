import { Global, Module } from '@nestjs/common';
import { RedisPublisherService } from './redis.publisher.service';
import { RedisSubscriberService } from './redis.subscriber.service';
import { pubClient, subClient } from './redis-client';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    RedisPublisherService,
    RedisSubscriberService,
    { provide: 'REDIS_PUB_CLIENT', useValue: pubClient },
    { provide: 'REDIS_SUB_CLIENT', useValue: subClient },
    RedisService,
  ],
  exports: [RedisPublisherService, RedisSubscriberService, RedisService],
})
export class RedisModule {}
