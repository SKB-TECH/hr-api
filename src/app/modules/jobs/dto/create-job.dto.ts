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
  ArrayMaxSize,
  IsInt,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobCategory, JobLevel, EmploymentType } from '../../../../utils/enums';
import { JobRequirementDto } from './job-requirement.dto';

export class JobBenefitDto {
  @ApiPropertyOptional({
    description: 'Frontend-only list key; not persisted.',
  })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty({ example: 'Full Healthcare' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'Comprehensive healthcare coverage.' })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({ example: 'Healthcare' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;
}

export class CreateJobDto {
  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsNotEmpty()
  @ValidateIf((value) => !value.jobTitle)
  @IsString()
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional({
    example: 'Software Engineer',
    description: 'Frontend field alias for title.',
  })
  @ValidateIf((value) => !value.title)
  @IsString()
  @MaxLength(80)
  jobTitle?: string;

  @ApiProperty({ enum: JobCategory, example: JobCategory.ENGINEERING })
  @Transform(({ value }) =>
    value === 'Development'
      ? JobCategory.ENGINEERING
      : String(value).toUpperCase(),
  )
  @IsNotEmpty()
  @IsEnum(JobCategory)
  category: JobCategory;

  @ApiPropertyOptional({ enum: JobLevel, default: JobLevel.MID_LEVEL })
  @IsOptional()
  @IsEnum(JobLevel)
  jobLevel?: JobLevel;

  @ValidateIf((value) => !value.employmentTypes?.length)
  @Transform(({ value }) => normalizeEmploymentType(value))
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({
    enum: EmploymentType,
    isArray: true,
    description: 'One or more employment options selected by the job form.',
  })
  @ValidateIf((value) => value.employmentType === undefined)
  @Transform(({ value }) =>
    Array.isArray(value) ? value.map(normalizeEmploymentType) : value,
  )
  @IsArray()
  @ArrayMaxSize(5)
  @IsEnum(EmploymentType, { each: true })
  employmentTypes?: EmploymentType[];

  @ApiPropertyOptional({
    example: 'Kinshasa',
    default: 'Company location or Remote',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Frontend alias for salaryMin' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSalary?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ description: 'Frontend alias for salaryMax' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSalary?: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  salaryCurrency?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  applyBefore?: string;

  @ApiPropertyOptional({ description: 'Full job description.' })
  @ValidateIf((value) => !value.jobDescription)
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Frontend field alias for description.' })
  @ValidateIf((value) => !value.description)
  @IsString()
  jobDescription?: string;

  @ApiProperty({ description: 'Core responsibilities.' })
  @IsNotEmpty()
  @IsString()
  responsibilities: string;

  @ApiProperty({ description: 'Candidate profile and qualifications.' })
  @IsNotEmpty()
  @IsString()
  whoYouAre: string;

  @ApiPropertyOptional({ description: 'Optional qualifications.' })
  @IsOptional()
  @IsString()
  niceToHaves?: string;

  @ApiPropertyOptional({ description: 'Frontend field alias for niceToHaves.' })
  @IsOptional()
  @IsString()
  niceToHave?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10000, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity?: number;

  @ApiPropertyOptional({ type: [JobBenefitDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => JobBenefitDto)
  benefits?: JobBenefitDto[];

  @ApiPropertyOptional({
    description: 'Array of Skill IDs to attach to this job posting',
    example: ['d4654ab8-a094-4606-8600-420e8607ccf4'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[];

  @ApiPropertyOptional({
    type: [String],
    description:
      'Required skill names accepted from the current frontend form.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  skills?: string[];

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

function normalizeEmploymentType(value: unknown) {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/-/g, '_').replace(/\s+/g, '_').toUpperCase();
}
