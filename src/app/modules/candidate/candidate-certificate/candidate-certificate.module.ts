import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateCertificationService } from './candidate-certificate.service';
import { CandidateCertificationController } from './candidate-certificate.controller';
import { CandidateCertification } from './entities/candidate-certification.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CandidateCertification, CandidateProfile]),
  ],
  controllers: [CandidateCertificationController],
  providers: [CandidateCertificationService],
  exports: [CandidateCertificationService],
})
export class CandidateCertificationModule {}
