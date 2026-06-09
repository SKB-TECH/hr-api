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
import { ApplicationsModule } from './modules/applications/applications.module';
import { CandidateModule } from './modules/candidate/candidate.module';

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
    ApplicationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
