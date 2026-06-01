import { Module } from '@nestjs/common';
import {  } from './candidate-profile.service';
import { CandidateProfilesController } from './candidate-profile.controller';
import { CandidateProfilesService } from './candidate-profile.service';
import { CandidateProfilesRepository } from './candidateProfiles.repository';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';

@Module({
  imports: [
    CloudinaryModule,
  ],
  controllers: [CandidateProfilesController],
  providers: [CandidateProfilesService, CandidateProfilesRepository],
  exports: [CandidateProfilesService],
})
export class CandidateProfileModule {}
