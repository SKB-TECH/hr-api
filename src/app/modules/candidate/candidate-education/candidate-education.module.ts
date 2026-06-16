import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateEducationController } from './candidate-education.controller';
import { CandidateEducationService } from './candidate-education.service';
import { CandidateEducation } from './entities/candidate-education.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CandidateEducation, CandidateProfile])],
  controllers: [CandidateEducationController],
  providers: [CandidateEducationService],
})
export class CandidateEducationModule {}
