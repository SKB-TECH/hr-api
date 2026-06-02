import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';

import { AuthModule } from './modules/auth/auth.module';
import { CandidateProfileModule } from './modules/candidate-profile/candidate-profile.module';
import { CandidateResumeModule } from './modules/candidate-resume/candidate-resume.module';
import { CandidateResumeController } from './modules/candidate-resume/candidate-resume.controller';
import { CandidateResumeService } from './modules/candidate-resume/candidate-resume.service';
import { CompaniesModule } from './modules/companies/companies.module';

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
    CandidateProfileModule,
    CandidateResumeModule,
    CompaniesModule,
  ],
  controllers: [CandidateResumeController],
  providers: [CandidateResumeService],
})
export class AppModule {}
