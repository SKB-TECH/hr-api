import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Charles's Modules
import { ContactModule } from './contact/contact.module';
import { JobsModule } from './jobs/jobs.module';

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
})
export class AppModule {}