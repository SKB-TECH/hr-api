import { Module } from '@nestjs/common';
import {  } from './candidate-profile.service';
import { CandidateProfilesController } from './candidate-profile.controller';
import { CandidateProfilesService } from './candidate-profile.service';
import { CandidateProfilesRepository } from './candidateProfiles.repository';

@Module({
  controllers: [CandidateProfilesController],
  providers: [CandidateProfilesService, CandidateProfilesRepository],
})
export class CandidateProfileModule {}
