import { createClient, RedisClientType } from 'redis';
import { Logger } from '@nestjs/common';
import { ConfigService } from '../env/config.service';

const logger = new Logger('RedisClient');

const configService = new ConfigService();
const redisUrl = configService.get('APP_REDIS_URL');
const redisSslConnection =
  configService.get('APP_REDIS_SSL_CONNECTION') === 'true';

const socketOptions: any = {
  reconnectStrategy: (retries: number) => {
    if (retries > 10) {
      logger.warn('Redis max reconnect attempts reached, stopping retries');
      return new Error('Max reconnect attempts reached');
    }
    return Math.min(retries * 500, 5000);
  },
};
if (redisSslConnection) {
  socketOptions.tls = true;
}

export const pubClient: RedisClientType = createClient({
  url: redisUrl,
  socket: socketOptions,
});

pubClient.on('error', (error) =>
  logger.warn(`Redis client error: ${error.message}`),
);

if (redisUrl) {
  pubClient
    .connect()
    .then(() => logger.log('Redis client connected'))
    .catch((error) => logger.warn(`Redis connection failed: ${error.message}`));
} else {
  logger.warn('APP_REDIS_URL not set — Redis client will stay disconnected');
}
