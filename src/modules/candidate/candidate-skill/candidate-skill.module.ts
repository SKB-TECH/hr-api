import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Skill } from './entities/skill.entity';
import { SkillCategory } from './entities/skill-category.entity';
import { CandidateSkill } from './entities/candidate-skill.entity';
import { SkillManagementService } from './candidate-skill.service';
import { SkillManagementController } from './candidate-skill.controller';
import { PrismaModule} from '@/infrastructure/prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [SkillManagementController],
  providers: [SkillManagementService],
  exports: [SkillManagementService],
})
export class CandidateSkillModule {}