import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';

export class CreateCandidateExperienceDto {
  @ApiProperty({
    example: 'infinity innovations co',
    description:
      'Name of the company where the candidate worked',
  })
  @IsString()
  companyName: string;

  @ApiProperty({
    example: 'Backend Developer',
    description:
      'Job title held by the candidate',
  })
  @IsString()
  position: string;

  @ApiProperty({
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
    description:
      'Type of employment contract',
  })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiProperty({
    example:
      'Built scalable REST APIs using NestJS and PostgreSQL.',
    description:
      'Summary of responsibilities and achievements',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '2023-01-15',
    description:
      'Employment start date',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2025-06-30',
    description:
      'Employment end date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: false,
    description:
      'Indicates whether the candidate is still working here',
  })
  @IsBoolean()
  isCurrent: boolean;

  @ApiProperty({
    example: 'Rwanda',
    description:
      'Country where the company is located',
    required: false,
  })
  @IsOptional()
  @IsString()
  countryName?: string;

  @ApiProperty({
    example: 'Kigali',
    description:
      'City where the company is located',
    required: false,
  })
  @IsOptional()
  @IsString()
  cityName?: string;
}