import { Module } from '@nestjs/common';

import { CandidateExperienceController } from './candidate-experience.controller';
import { CandidateExperienceService } from './candidate-experience.service';
import { CandidateExperienceRepository } from './candidate-experience.repository';


import { CandidateProfileModule } from '../candidate-profile/candidate-profile.module';

@Module({
  imports: [

    CandidateProfileModule,
  ],
  controllers: [
    CandidateExperienceController,
  ],
  providers: [
    CandidateExperienceService,
    CandidateExperienceRepository,
  ],
  exports: [
    CandidateExperienceService,
  ],
})
export class CandidateExperienceModule {}