import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsUUID, Max, Min } from 'class-validator';

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export class AddCandidateSkillDto {
  @ApiProperty({
    description: 'The canonical database unique identifier (UUID v4) of the skill within the platform catalog.',
    example: '8f3b29c1-472d-4bfb-b462-871d87f7b244',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'skillId must be a valid UUID v4' })
  @IsNotEmpty({ message: 'skillId is a required parameter' })
  skillId: string;

  @ApiProperty({
    description: 'The candidate proficiency tier for this specific technology stack.',
    enum: SkillLevel,
    example: SkillLevel.EXPERT,
  })
  @IsEnum(SkillLevel, { message: 'level must be one of: beginner, intermediate, advanced, expert' })
  @IsNotEmpty({ message: 'proficiency level is a required parameter' })
  level: SkillLevel;

  @ApiProperty({
    description: 'Total number of verified professional years working with this technology.',
    minimum: 0,
    maximum: 50,
    example: 4,
    type: Number,
  })
  @IsInt({ message: 'yearsExperience must be a whole number' })
  @Min(0, { message: 'yearsExperience cannot be negative' })
  @Max(50, { message: 'yearsExperience exceeds reasonable human limits' })
  @IsNotEmpty({ message: 'yearsExperience is a required parameter' })
  yearsExperience: number;
}