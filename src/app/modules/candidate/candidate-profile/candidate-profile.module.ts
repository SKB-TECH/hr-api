import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateProfilesController } from './candidate-profile.controller';
import { CandidateProfilesService } from './candidate-profile.service';
import { User } from '@/app/modules/users/entities/user.entity';
import { CandidateProfile } from './entities/candidate-profile.entity';
import { PublicCandidateProfilesController } from './public-candidate-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, CandidateProfile])],
  controllers: [CandidateProfilesController, PublicCandidateProfilesController],
  providers: [CandidateProfilesService],
  exports: [CandidateProfilesService],
})
export class CandidateProfileModule {}
