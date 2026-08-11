import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
  IsNumber,
  IsArray,
  IsDateString,
  IsUUID,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  EmploymentType,
  JobLevel,
  JobCategory,
  JobStatus,
} from '../../../../utils/enums';

export enum JobSortOption {
  MOST_RELEVANT = 'most_relevant',
  NEWEST = 'newest',
  SALARY_HIGH = 'salary_high',
  SALARY_LOW = 'salary_low',
}

export class QueryJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiPropertyOptional({
    example: 'Social Media',
    description: 'Search by job title or keyword',
  })
  keyword?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Paris, France',
    description: 'Filter by location',
  })
  location?: string;

  @IsOptional()
  @IsUUID('4')
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by company' })
  companyId?: string;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(EmploymentType, { each: true })
  @ApiPropertyOptional({
    enum: EmploymentType,
    isArray: true,
    example: ['FULL_TIME', 'REMOTE'],
    description: 'Filter by employment type',
  })
  employmentType?: EmploymentType[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(JobCategory, { each: true })
  @ApiPropertyOptional({
    enum: JobCategory,
    isArray: true,
    example: ['DESIGN', 'MARKETING'],
    description: 'Filter by category',
  })
  category?: JobCategory[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(JobLevel, { each: true })
  @ApiPropertyOptional({
    enum: JobLevel,
    isArray: true,
    example: ['ENTRY_LEVEL', 'MID_LEVEL'],
    description: 'Filter by job level',
  })
  jobLevel?: JobLevel[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(JobStatus, { each: true })
  @ApiPropertyOptional({ enum: JobStatus, isArray: true })
  status?: JobStatus[];

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-07-01' })
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-07-31' })
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 700, description: 'Minimum salary' })
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 3000, description: 'Maximum salary' })
  salaryMax?: number;

  @IsOptional()
  @IsEnum(JobSortOption)
  @ApiPropertyOptional({
    enum: JobSortOption,
    default: JobSortOption.MOST_RELEVANT,
  })
  sort?: JobSortOption = JobSortOption.MOST_RELEVANT;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ example: 10, default: 10 })
  limit?: number = 10;
}
