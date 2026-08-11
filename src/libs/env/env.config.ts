import * as dotenv from 'dotenv';
import * as path from 'path';

const envFiles =
  process.env.NODE_ENV === 'local' ? ['.env.local', '.env'] : ['.env'];
dotenv.config({
  path: envFiles.map((envFile) => path.resolve(process.cwd(), envFile)),
});

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

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'noreply@hr-api.local',
  HR_AI_SERVICE_TOKEN: process.env.HR_AI_SERVICE_TOKEN,
  HR_AI_SERVICE_TOKEN_CURRENT: process.env.HR_AI_SERVICE_TOKEN_CURRENT,
  HR_AI_SERVICE_TOKEN_PREVIOUS: process.env.HR_AI_SERVICE_TOKEN_PREVIOUS,
  HR_AI_BASE_URL: process.env.HR_AI_BASE_URL,
  HR_AI_REQUEST_TIMEOUT_MS: process.env.HR_AI_REQUEST_TIMEOUT_MS,
  WEB_APP_URL: process.env.WEB_APP_URL || 'http://localhost:3000',
};
