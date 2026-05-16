import { IsNotEmpty, IsOptional, IsString, MaxLength, IsUrl, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  location: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMax: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  salaryExtras?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  jobType: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  reference: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;
}

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  salaryExtras?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  jobType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
