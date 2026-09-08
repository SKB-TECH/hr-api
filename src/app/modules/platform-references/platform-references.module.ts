import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformReference } from './entities/platform-reference.entity';
import { PlatformReferencesController } from './platform-references.controller';
import { PlatformReferencesService } from './platform-references.service';
import { Country } from './entities/country.entity';
import { Language } from './entities/language.entity';
import { Skill } from '../candidate/candidate-skill/entities/skill.entity';
import { SkillCategory } from '../candidate/candidate-skill/entities/skill-category.entity';
import { Profession } from '../users/entities/profession.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformReference, Country, Language, Skill, SkillCategory, Profession])],
  controllers: [PlatformReferencesController],
  providers: [PlatformReferencesService],
  exports: [PlatformReferencesService],
})
export class PlatformReferencesModule {}
