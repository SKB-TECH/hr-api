import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';


import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';


import { CandidateProfileModule } from './modules/candidate-profile/candidate-profile.module';
import { CandidateResumeModule } from './modules/candidate-resume/candidate-resume.module';
import { CandidateResumeController } from './modules/candidate-resume/candidate-resume.controller';
import { CandidateResumeService } from './modules/candidate-resume/candidate-resume.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'hr_api'),
       
        synchronize: true,
        logging: false,
      }),
    }),
    PrismaModule,
    AuthModule,
    CandidateProfileModule,
    CandidateResumeModule,
  ],
  controllers: [CandidateResumeController],
  providers: [CandidateResumeService],
})
export class AppModule {}
