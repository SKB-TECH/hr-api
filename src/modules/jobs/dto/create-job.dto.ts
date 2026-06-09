import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsDateString, 
  IsNotEmpty 
} from 'class-validator';
import { JobCategory, JobLevel, EmploymentType } from '@prisma/client';

export class CreateJobDto {
  // --- Step 1 Fields: Basics ---

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
  salaryCurrency?: string; // Default is usually handled in the database or service

  @IsOptional()
  @IsDateString()
  applyBefore?: string; // Stored as a date string from the frontend

  // --- Step 2 Fields: Description ---

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
}