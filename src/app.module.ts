import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

// Charles's Modules
import { ContactModule } from './contact/contact.module';
import { JobsModule as HomepageJobsModule } from './jobs/jobs.module'; // Aliased to prevent naming collision

// Gilbert's Modules (Prisma & Advanced Features)
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { HeroModule } from './modules/hero/hero.module';

// Esther's Modules and Entities (TypeORM)
import { AboutModule } from './modules/about/about.module';
import { MediaModule } from './modules/media/media.module';
import { HeroSection } from './modules/about/entities/hero-section.entity';
import { CeoSection } from './modules/about/entities/ceo-section.entity';
import { TeamMember } from './modules/about/entities/team-member.entity';
import { ContactSubmission } from './modules/about/entities/contact-submission.entity';
import { Media } from './modules/media/entities/media.entity';

@Module({
  imports: [
    // Global Configurations
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),

    // Databases (TypeORM & Prisma running side-by-side)
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
    PrismaModule,

    // Infrastructure
    CloudinaryModule,
    
    // Feature Modules
    ContactModule,
    HomepageJobsModule, // Charles's initial mock endpoints
    JobsModule,         // Gilbert's full CRUD implementation
    HeroModule,
    AboutModule,
    MediaModule,
  ],
  controllers: [], // <-- Emptied this array!
  providers: [],   // <-- Emptied this array!
})
export class AppModule {}