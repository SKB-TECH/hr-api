import { Module } from '@nestjs/common';
import { CandidateEducationController } from './candidate-education.controller';
import { CandidateEducationService } from './candidate-education.service';
import { CandidateEducationRepository } from './candidate-education.repository';
@Module({
  controllers: [CandidateEducationController],
  providers: [CandidateEducationService, CandidateEducationRepository],
})
export class CandidateEducationModule {}