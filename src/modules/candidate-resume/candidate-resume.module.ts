import { Module } from '@nestjs/common';
import { CandidateResumeService } from './candidate-resume.service';
import { CandidateResumeController } from './candidate-resume.controller';
import {CandidateProfileModule} from "../candidate-profile/candidate-profile.module";
import { CandidateProfilesRepository } from './candidate-resume.repository';

@Module({
  imports: [CandidateProfileModule],
  exports: [CandidateResumeService, CandidateProfilesRepository],
  providers: [CandidateResumeService, CandidateProfilesRepository],
  controllers: [CandidateResumeController]
})
export class CandidateResumeModule {}
