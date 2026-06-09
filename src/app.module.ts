import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PrismaModule,
    CloudinaryModule,
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
  providers: [],
})
export class AppModule {}
