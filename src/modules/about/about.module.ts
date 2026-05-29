import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';
import { AboutRepository } from './repositories/about.repository';
import { HeroSection } from './entities/hero-section.entity';
import { CeoSection } from './entities/ceo-section.entity';
import { TeamMember } from './entities/team-member.entity';
import { ContactSubmission } from './entities/contact-submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HeroSection, CeoSection, TeamMember, ContactSubmission]),
  ],
  controllers: [AboutController],
  providers: [AboutService, AboutRepository],
})
export class AboutModule {}
