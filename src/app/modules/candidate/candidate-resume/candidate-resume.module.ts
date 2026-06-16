import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateResumeService } from './candidate-resume.service';
import { CandidateResumeController } from './candidate-resume.controller';
import { Resume } from './entities/resume.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resume, CandidateProfile])],
  exports: [CandidateResumeService],
  providers: [CandidateResumeService],
  controllers: [CandidateResumeController],
})
export class CandidateResumeModule {}
