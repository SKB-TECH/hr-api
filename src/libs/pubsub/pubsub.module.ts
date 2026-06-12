import { Global, Module } from '@nestjs/common';
import { PubSubService } from './pubsub.service';
import { ConfigModule } from '../env/config.module';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [ConfigModule, RedisModule],
  providers: [PubSubService],
  exports: [PubSubService],
})
export class PubSubModule {}
