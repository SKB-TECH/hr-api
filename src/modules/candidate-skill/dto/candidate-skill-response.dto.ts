
import { ApiProperty } from '@nestjs/swagger';
import { SkillDto } from './skill.dto';
import { SkillLevel } from './create-candidate-skill.dto';

export class CandidateSkillResponseDto {
  @ApiProperty({ example: 'c13b29c1-922d-4bfb-b462-871d87f7b999', format: 'uuid', description: 'CandidateSkill mapping identifier' })
  id: string;

  @ApiProperty({ enum: SkillLevel, example: SkillLevel.EXPERT, description: 'Proficiency level for the mapped skill' })
  level: string;

  @ApiProperty({ example: 4, description: 'Number of years experience for this skill' })
  yearsExperience: number;

  @ApiProperty({ type: () => SkillDto, description: 'Nested skill details' })
  skill: SkillDto;
}

export class SkillDeletionSuccessEntity {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Technology skill successfully detached from your candidate portfolio context.' })
  message: string;
}