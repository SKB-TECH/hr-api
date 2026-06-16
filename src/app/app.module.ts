import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { createGcpLoggingPinoConfig } from '@google-cloud/pino-logging-gcp-config';
import { randomUUID } from 'crypto';
import { ConfigModule } from '../libs/env/config.module';
import { I18nModule } from '../libs/i18n/i18n.module';
import { I18nMiddleware } from '../libs/i18n/i18n.middleware';
import { RedisModule } from '../libs/redis/redis.module';
import { PubSubModule } from '../libs/pubsub/pubsub.module';
import { MailModule } from '../libs/mail/mail.module';
import { StorageModule } from '../libs/storage/storage.module';
import { connectionSource } from '../database/config/datasource';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { AuditLogModule } from './modules/audit-logs/audit-log.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { SkillsModule } from './modules/skills/skills.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { CandidateModule } from './modules/candidate/candidate.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LocalizationModule } from './modules/localization/localization.module';
import { PipelineStagesModule } from './modules/pipeline-stages/pipeline-stages.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ConfigModule,
    LoggerModule.forRoot({
      pinoHttp:
        process.env.NODE_ENV === 'local'
          ? {
              transport: { target: 'pino-pretty' },
              level: 'debug',
              autoLogging: true,
              genReqId: (req: any) =>
                req.headers['x-request-id'] || randomUUID(),
              customProps: (req: any) => ({
                userId: req.user?.id,
              }),
            }
          : {
              ...createGcpLoggingPinoConfig(
                {
                  serviceContext: {
                    service: 'hr-api',
                    version: process.env.npm_package_version || '0.0.1',
                  },
                },
                {
                  level:
                    process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
                },
              ),
              autoLogging: process.env.NODE_ENV !== 'production',
              genReqId: (req: any) =>
                req.headers['x-request-id'] || randomUUID(),
              customProps: (req: any) => ({
                userId: req.user?.id,
              }),
            },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async () => ({
        ...connectionSource.options,
        autoLoadEntities: true,
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]),
    I18nModule,
    RedisModule,
    PubSubModule,
    MailModule,
    StorageModule,
    AuthModule,
    UsersModule,
    CandidateModule,
    CompaniesModule,
    AuditLogModule,
    JobsModule,
    SkillsModule,
    ApplicationsModule,
    InterviewsModule,
    AnalyticsModule,
    LocalizationModule,
    PipelineStagesModule,
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(I18nMiddleware).forRoutes('*');
  }
}
