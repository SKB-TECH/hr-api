import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Availability,
  WorkType,
  ProfileVisibility,
} from '../../../../../utils/enums';

export class UpdateUserCandidateProfileDto {
  @ApiPropertyOptional({ example: 'Prince ngenzi' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '+250788123456' })
  @IsString()
  @IsOptional()
  phoneNumber?: string | null;

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

  @ApiPropertyOptional({
    example: 'Passionate developer building scalable systems...',
  })
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

  @ApiPropertyOptional({ example: 2500.0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  currentSalary?: number;

  @ApiPropertyOptional({ example: 4500.0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  expectedSalary?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  salaryCurrency?: string;

  @ApiPropertyOptional({ example: 5 })
  @Type(() => Number)
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

  @ApiPropertyOptional({
    enum: ProfileVisibility,
    example: ProfileVisibility.public,
  })
  @IsEnum(ProfileVisibility)
  @IsOptional()
  profileVisibility?: ProfileVisibility;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) =>
    value === undefined ? undefined : value === true || value === 'true',
  )
  @IsBoolean()
  @IsOptional()
  openToWork?: boolean;
}
