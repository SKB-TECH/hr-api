import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Charles's Modules
import { ContactModule } from './contact/contact.module';
import { JobsModule } from './jobs/jobs.module';
=======
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { HeroModule } from './modules/hero/hero.module';
>>>>>>> a7948a2e2f81b2b8bfd274b5e9660dbde1d4ad91

// Esther's Modules and Entities
import { AboutModule } from './modules/about/about.module';
import { MediaModule } from './modules/media/media.module';
import { HeroSection } from './modules/about/entities/hero-section.entity';
import { CeoSection } from './modules/about/entities/ceo-section.entity';
import { TeamMember } from './modules/about/entities/team-member.entity';
import { ContactSubmission } from './modules/about/entities/contact-submission.entity';
import { Media } from './modules/media/entities/media.entity';

@Module({
  imports: [
<<<<<<< HEAD
    // Esther's Global Config & Database Setup
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
        entities: [HeroSection, CeoSection, TeamMember, ContactSubmission, Media],
        synchronize: true,
        logging: false,
      }),
    }),
    
    // Charles's Feature Modules
    ContactModule,
    JobsModule,
    
    // Esther's Feature Modules
    AboutModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
=======
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    PrismaModule,
    CloudinaryModule,
    JobsModule,
    HeroModule,
  ],
  controllers: [],
  providers: [],
>>>>>>> a7948a2e2f81b2b8bfd274b5e9660dbde1d4ad91
})
export class AppModule {}