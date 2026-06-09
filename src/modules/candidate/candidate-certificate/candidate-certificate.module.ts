import { Module } from '@nestjs/common';
import { CandidateCertificationService } from './candidate-certificate.service';
import { CandidateCertificationController } from './candidate-certificate.controller';

@Module({
  controllers: [CandidateCertificationController],
  providers: [CandidateCertificationService],
  exports: [CandidateCertificationService],
})
export class CandidateCertificationModule {}