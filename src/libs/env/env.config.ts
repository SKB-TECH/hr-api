import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile = process.env.NODE_ENV === 'local' ? '.env.local' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const config = {
  NODE_ENV: process.env.NODE_ENV,
  APP_PORT: process.env.APP_PORT || process.env.PORT,

  POSTGRES_DB: process.env.POSTGRES_DB,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_PORT: process.env.POSTGRES_PORT,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  DATABASE_SSL_CONNECTION: process.env.DATABASE_SSL_CONNECTION,
  DATABASE_CA_CERT: process.env.DATABASE_CA_CERT,
  DB_POOL_MAX: process.env.DB_POOL_MAX,
  DB_POOL_IDLE_TIMEOUT: process.env.DB_POOL_IDLE_TIMEOUT,
  DB_POOL_CONNECTION_TIMEOUT: process.env.DB_POOL_CONNECTION_TIMEOUT,

  APP_REDIS_URL: process.env.APP_REDIS_URL,
  APP_REDIS_SSL_CONNECTION: process.env.APP_REDIS_SSL_CONNECTION || 'false',

  GCS_BUCKET: process.env.GCS_BUCKET,
  GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
  GCS_KEY_FILE: process.env.GCS_KEY_FILE,
  PUBSUB_ENABLED: process.env.PUBSUB_ENABLED,
  PUBSUB_PROJECT_ID:
    process.env.PUBSUB_PROJECT_ID || process.env.GCS_PROJECT_ID,
  PUBSUB_KEY_FILE: process.env.PUBSUB_KEY_FILE || process.env.GCS_KEY_FILE,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '24h',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',
  JWT_SECRET_CURRENT: process.env.JWT_SECRET_CURRENT,
  JWT_SECRET_PREVIOUS: process.env.JWT_SECRET_PREVIOUS,
  JWT_REFRESH_SECRET_CURRENT: process.env.JWT_REFRESH_SECRET_CURRENT,
  JWT_REFRESH_SECRET_PREVIOUS: process.env.JWT_REFRESH_SECRET_PREVIOUS,

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
};
