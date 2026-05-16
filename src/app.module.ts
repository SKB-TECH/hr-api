import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AboutModule } from './modules/about/about.module';
import { MediaModule } from './modules/media/media.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { HeroSection } from './modules/about/entities/hero-section.entity';
import { CeoSection } from './modules/about/entities/ceo-section.entity';
import { TeamMember } from './modules/about/entities/team-member.entity';
import { ContactSubmission } from './modules/about/entities/contact-submission.entity';
import { Media } from './modules/media/entities/media.entity';
import { Job } from './modules/jobs/entities/job.entity';
import { JobApplication } from './modules/jobs/entities/job-application.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        entities: [HeroSection, CeoSection, TeamMember, ContactSubmission, Media, Job, JobApplication],
        synchronize: true,
        logging: false,
      }),
    }),
    AboutModule,
    MediaModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
