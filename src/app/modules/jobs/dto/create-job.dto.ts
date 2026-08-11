import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobCategory, JobLevel, EmploymentType } from '../../../../utils/enums';
import { JobRequirementDto } from './job-requirement.dto';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsEnum(JobCategory)
  category: JobCategory;

  @IsNotEmpty()
  @IsEnum(JobLevel)
  jobLevel: JobLevel;

  @IsNotEmpty()
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @IsOptional()
  @IsDateString()
  applyBefore?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  responsibilities: string;

  @IsNotEmpty()
  @IsString()
  whoYouAre: string;

  @IsOptional()
  @IsString()
  niceToHaves?: string;

  @ApiPropertyOptional({
    description: 'Array of Skill IDs to attach to this job posting',
    example: ['d4654ab8-a094-4606-8600-420e8607ccf4'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[];

  @ApiPropertyOptional({
    description: 'Required skill IDs. Prefer this over the legacy skillIds.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  requiredSkillIds?: string[];

  @ApiPropertyOptional({ description: 'Optional / nice-to-have skill IDs.' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  niceToHaveSkillIds?: string[];

  @ApiPropertyOptional({
    description:
      'Mandatory technology IDs. Missing values make a candidate ineligible and remain separate from the score.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  hardRequiredSkillIds?: string[];

  @ApiPropertyOptional({ type: [JobRequirementDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobRequirementDto)
  requirements?: JobRequirementDto[];
}
