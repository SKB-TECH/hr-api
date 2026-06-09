import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsEnum, IsInt, Min } from 'class-validator';
import { SkillLevel } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({ description: 'The name of the skill category', example: 'Creative' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateSkillDto {
  @ApiProperty({ description: 'The display name of the skill', example: 'Figma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The UUID of the SkillCategory row', format: 'uuid', example: 'a6e35da1-9493-4903-bf68-80b18361bdf6' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;
}

export class AssignSkillDto {
  @ApiProperty({ description: 'The UUID of the Skill row', format: 'uuid', example: 'e30bd6b8-47a5-487c-b179-813ef03714c3' })
  @IsUUID()
  @IsNotEmpty()
  skillId: string;

  @ApiProperty({ description: 'The skill level matching the database Enum', enum: SkillLevel, example: 'expert' })
  @IsEnum(SkillLevel)
  @IsNotEmpty()
  level: SkillLevel;

  @ApiProperty({ description: 'Years of active experience', example: 5, minimum: 0 })
  @IsInt()
  @Min(0)
  yearsExperience: number;
}