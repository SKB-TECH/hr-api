// src/modules/candidate-profile/dto/update-candidate-profile.dto.ts
import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, IsNumber, Min, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Availability, WorkType, ProfileVisibility } from '@prisma/client';

export class UpdateUserCandidateProfileDto {
  
  @ApiPropertyOptional({ example: 'Prince ngenzi' })
  @IsString()
  @IsOptional()
  fullName?: string;



  @ApiPropertyOptional({ example: '+250788123456' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
 
  avatar?: string;

  @ApiPropertyOptional({ example: 'Male' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: '2026-06-23' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ example: 'Senior Full Stack Engineer' })
  @IsString()
  @IsOptional()
  headline?: string;

  @ApiPropertyOptional({ example: 'Passionate developer building scalable systems...' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ example: 'Rwanda' })
  @IsString()
  @IsOptional()
  countryName?: string; 

  @ApiPropertyOptional({ example: 'Kigali' })
  @IsString()
  @IsOptional()
  cityName?: string; 

  @ApiPropertyOptional({ example: 'KK 342 St' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 2500.00 })
  @IsNumber()
  @IsOptional()
  currentSalary?: number;

  @ApiPropertyOptional({ example: 4500.00 })
  @IsNumber()
  @IsOptional()
  expectedSalary?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  salaryCurrency?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(0)
  @IsOptional()
  yearsExperience?: number;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/username' })
  @IsString()
  @IsOptional()
  linkedinUrl?: string;

  @ApiPropertyOptional({ example: 'https://github.com/username' })
  @IsString()
  @IsOptional()
  githubUrl?: string;

  @ApiPropertyOptional({ example: 'https://portfolio.dev' })
  @IsString()
  @IsOptional()
  portfolioUrl?: string;

  @ApiPropertyOptional({ enum: Availability, example: Availability.immediate })
  @IsEnum(Availability)
  @IsOptional()
  availability?: Availability;

  @ApiPropertyOptional({ enum: WorkType, example: WorkType.hybrid })
  @IsEnum(WorkType)
  @IsOptional()
  workType?: WorkType;

  @ApiPropertyOptional({ enum: ProfileVisibility, example: ProfileVisibility.public })
  @IsEnum(ProfileVisibility)
  @IsOptional()
  profileVisibility?: ProfileVisibility;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  openToWork?: boolean;
}