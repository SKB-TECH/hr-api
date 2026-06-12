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

export const subClient: RedisClientType = pubClient.duplicate();

pubClient.on('error', (error) =>
  logger.warn(`Redis PubClient error: ${error.message}`),
);
subClient.on('error', (error) =>
  logger.warn(`Redis SubClient error: ${error.message}`),
);

if (redisUrl) {
  pubClient
    .connect()
    .then(() => logger.log('Redis PubClient connected'))
    .catch((error) =>
      logger.warn(`PubClient connection failed: ${error.message}`),
    );

  subClient
    .connect()
    .then(() => logger.log('Redis SubClient connected'))
    .catch((error) =>
      logger.warn(`SubClient connection failed: ${error.message}`),
    );
} else {
  logger.warn('APP_REDIS_URL not set — Redis clients will stay disconnected');
}
