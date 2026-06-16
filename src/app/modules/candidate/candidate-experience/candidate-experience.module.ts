import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidateExperienceController } from './candidate-experience.controller';
import { CandidateExperienceService } from './candidate-experience.service';
import { CandidateExperience } from './entities/candidate-experience.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CandidateExperience, CandidateProfile])],
  controllers: [CandidateExperienceController],
  providers: [CandidateExperienceService],
  exports: [CandidateExperienceService],
})
export class CandidateExperienceModule {}
