import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsUrl,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentType, ExperienceLevel } from '@prisma/client';

export class CreateJobDto {
  @ApiProperty({ example: 'Senior Frontend Developer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Kigali, Rwanda' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  salaryMin?: number;

  @ApiPropertyOptional({ example: 80000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  salaryMax?: number;

  @ApiProperty({ example: '<p>Job description here</p>' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: 'Short description for card' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ enum: EmploymentType, example: EmploymentType.FULL_TIME })
  @IsEnum(EmploymentType)
  @IsNotEmpty()
  employmentType: EmploymentType;

  @ApiProperty({ enum: ExperienceLevel, example: ExperienceLevel.SENIOR })
  @IsEnum(ExperienceLevel)
  @IsNotEmpty()
  experienceLevel: ExperienceLevel;

  @ApiProperty({ example: 'Infinity Tech Innovation' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/apply' })
  @IsOptional()
  @IsUrl()
  applicationUrl?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  deadline?: string;
  
  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Hero Background Image' })
  @IsOptional()
  file?: any;
}
