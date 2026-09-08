import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsNumber,
  Min,
  IsDateString,
  IsArray,
  ValidateNested,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Availability,
  WorkType,
  ProfileVisibility,
} from '../../../../../utils/enums';

const arrayValue = ({ value }: { value: unknown }) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try { const parsed = JSON.parse(String(value)); return Array.isArray(parsed) ? parsed : [value]; } catch { return [value]; }
};

export class LanguageProficiencyDto {
  @IsString() code: string;
  @IsIn(['beginner', 'intermediate', 'advanced', 'fluent', 'native']) level: string;
}

const languageProficienciesValue = ({ value }: { value: unknown }) => {
  let parsed: unknown = value;
  if (!Array.isArray(parsed)) {
    try {
      parsed = JSON.parse(String(value));
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) =>
    Object.assign(new LanguageProficiencyDto(), item),
  );
};

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

  @ApiPropertyOptional({ example: ['fr', 'en'], type: [String] })
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languageCodes?: string[];

  @ApiPropertyOptional({ type: [LanguageProficiencyDto], example: [{ code: 'fr', level: 'native' }, { code: 'en', level: 'advanced' }] })
  @Transform(languageProficienciesValue)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageProficiencyDto)
  @IsOptional()
  languageProficiencies?: LanguageProficiencyDto[];

  @ApiPropertyOptional({ type: [String], description: 'Profession UUIDs from /references/professions' })
  @Transform(arrayValue)
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  preferredProfessionIds?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Rwanda', 'France'] })
  @Transform(arrayValue)
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredCountries?: string[];

  @ApiPropertyOptional({ type: [String], enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] })
  @Transform(arrayValue)
  @IsArray()
  @IsIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'], { each: true })
  @IsOptional()
  preferredEmploymentTypes?: string[];

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  @IsOptional()
  acceptsRemote?: boolean;

  @ApiPropertyOptional({ example: 1500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  expectedSalaryMin?: number;

  @ApiPropertyOptional({ example: 3000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  expectedSalaryMax?: number;

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
