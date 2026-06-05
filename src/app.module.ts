import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CandidateProfileModule } from './modules/candidate-profile/candidate-profile.module';
import { CandidateResumeModule } from './modules/candidate-resume/candidate-resume.module';
import { CandidateEducationModule } from './modules/candidate-education/candidate-education.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { AuditLogModule } from './modules/audit-logs/audit-log.module';
import { JobsModule } from './modules/jobs/jobs.module';

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
    CandidateProfileModule,
    CandidateResumeModule,
    CandidateEducationModule,
    CompaniesModule,
    AuditLogModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
