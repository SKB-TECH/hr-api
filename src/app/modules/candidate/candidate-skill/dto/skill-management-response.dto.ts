import { ApiProperty } from '@nestjs/swagger';
import { SkillLevel } from '../../../../../utils/enums';

export class CategoryResponseDto {
  @ApiProperty({ example: 'a6e35da1-9493-4903-bf68-80b18361bdf6' })
  id: string;

  @ApiProperty({ example: 'Creative' })
  name: string;
}

export class SkillResponseDto {
  @ApiProperty({ example: 'e30bd6b8-47a5-487c-b179-813ef03714c3' })
  id: string;

  @ApiProperty({ example: 'Figma' })
  name: string;

  @ApiProperty({ example: 'figma' })
  slug: string;

  @ApiProperty({ type: CategoryResponseDto })
  category: CategoryResponseDto;
}

export class CandidateSkillResponseDto {
  @ApiProperty({ example: 'f87a8bca-7382-4112-9ab2-921c54e3d11b' })
  id: string;

  @ApiProperty({ example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b' })
  candidateId: string;

  @ApiProperty({ enum: SkillLevel, example: 'expert' })
  level: SkillLevel;

  @ApiProperty({ example: 5 })
  yearsExperience: number;

  @ApiProperty({ type: SkillResponseDto })
  skill: SkillResponseDto;
}
