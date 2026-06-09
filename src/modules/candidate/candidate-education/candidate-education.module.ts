// src/modules/candidate-education/candidate-education.module.ts
import { Module } from '@nestjs/common';
import { CandidateEducationController } from './candidate-education.controller';
import { CandidateEducationService } from './candidate-education.service';
import { CandidateEducationRepository } from './candidate-education.repository';
// import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  // imports: [PrismaModule],
  controllers: [CandidateEducationController],
  providers: [CandidateEducationService, CandidateEducationRepository],
})
export class CandidateEducationModule {}