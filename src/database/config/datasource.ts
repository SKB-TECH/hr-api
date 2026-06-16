import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ConfigService } from '../../libs/env/config.service';

const envFile = process.env.NODE_ENV === 'local' ? '.env.local' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
const configService = new ConfigService();

function getMigrationsPath(): string[] {
  const env = configService.get('NODE_ENV');
  switch (env) {
    case 'local':
      return ['dist/database/local-migrations/*.{js,ts}'];
    default:
      return ['dist/database/migrations/*.{js,ts}'];
  }
}

export const connectionSource = new DataSource({
  type: 'postgres',
  host: configService.get('POSTGRES_HOST'),
  port: parseInt(configService.get('POSTGRES_PORT')),
  username: configService.get('POSTGRES_USER'),
  password: configService.get('POSTGRES_PASSWORD'),
  database: configService.get('POSTGRES_DB'),
  synchronize: false,
  ssl:
    configService.get('DATABASE_SSL_CONNECTION') !== 'false'
      ? {
          rejectUnauthorized: configService.get('NODE_ENV') === 'production',
          ...(configService.get('DATABASE_CA_CERT')
            ? { ca: configService.get('DATABASE_CA_CERT') }
            : {}),
        }
      : false,
  extra: {
    max: parseInt(configService.get('DB_POOL_MAX') || '20'),
    idleTimeoutMillis: parseInt(
      configService.get('DB_POOL_IDLE_TIMEOUT') || '30000',
    ),
    connectionTimeoutMillis: parseInt(
      configService.get('DB_POOL_CONNECTION_TIMEOUT') || '5000',
    ),
  },
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: getMigrationsPath(),
});
