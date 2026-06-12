import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';
import { ConfigModule } from '../env/config.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [JwtModule.register({}), ConfigModule, RedisModule],
  providers: [JwtTokenService],
  exports: [JwtTokenService],
})
export class JwtTokenModule {}
