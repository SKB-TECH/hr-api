import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { SkillCategory } from './entities/skill-category.entity';
import { CandidateSkill } from './entities/candidate-skill.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';
import { SkillManagementService } from './candidate-skill.service';
import { SkillManagementController } from './candidate-skill.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateSkill,
      Skill,
      SkillCategory,
      CandidateProfile,
    ]),
  ],
  controllers: [SkillManagementController],
  providers: [SkillManagementService],
  exports: [SkillManagementService],
})
export class CandidateSkillModule {}
