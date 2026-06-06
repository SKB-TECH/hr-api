import { Module } from '@nestjs/common';
import { CandidateSkillService } from './candidate-skill.service';
import { CandidateSkillController } from './candidate-skill.controller';

@Module({
  controllers: [CandidateSkillController],
  providers: [CandidateSkillService],
})
export class CandidateSkillModule {}
