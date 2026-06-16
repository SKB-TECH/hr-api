import { Global, Module } from '@nestjs/common';
import { PubSubService } from './pubsub.service';
import { EmailPublisher } from './publishers/email.publisher';
import { ConfigModule } from '../env/config.module';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [ConfigModule, RedisModule],
  providers: [PubSubService, EmailPublisher],
  exports: [PubSubService, EmailPublisher],
})
export class PubSubModule {}
