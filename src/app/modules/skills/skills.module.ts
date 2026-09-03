import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { Skill } from '../candidate/candidate-skill/entities/skill.entity';
import { SkillCategory } from '../candidate/candidate-skill/entities/skill-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Skill, SkillCategory])],
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
