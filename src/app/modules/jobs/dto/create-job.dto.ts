import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { JobCategory, JobLevel, EmploymentType } from '../../../../utils/enums';

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
}
