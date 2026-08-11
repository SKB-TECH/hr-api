import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CompanyPerkDto {
  @ApiProperty({ example: 'Remote Working' })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({ example: 'Flexible work from approved locations.' })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/remote.svg' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  icon?: string;
}

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Infinity Innovation',
    description: 'The official name of the company',
  })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'Building the future of recruitment software.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Remote' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ type: [String], example: ['Kinshasa', 'London'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  locations?: string[];

  @ApiPropertyOptional({
    example: '2020-01-01T00:00:00.000Z',
    description: 'When the company was founded',
  })
  @IsOptional()
  @IsDateString()
  foundationDate?: string;

  @ApiPropertyOptional({
    example: 'Design',
    description: 'Industry or category of the company',
  })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '50-100 employees' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ example: 'https://infinityinnovation.com/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: 'https://infinityinnovation.com/banner.png' })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ example: 'https://infinityinnovation.com' })
  @IsOptional()
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @ApiPropertyOptional({ example: 'https://facebook.com/infinity' })
  @IsOptional()
  @IsUrl()
  facebook?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/infinity' })
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/infinity' })
  @IsOptional()
  @IsUrl()
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/infinity' })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/c/infinity' })
  @IsOptional()
  @IsUrl()
  youtube?: string;

  @ApiPropertyOptional({ type: [String], example: ['React', 'NestJS'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  techStack?: string[];

  @ApiPropertyOptional({ type: [CompanyPerkDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CompanyPerkDto)
  perks?: CompanyPerkDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUrl({ require_protocol: true }, { each: true })
  gallery?: string[];

  @ApiPropertyOptional({
    enum: ['public', 'authenticated', 'verified_candidates', 'private'],
    default: 'public',
  })
  @IsOptional()
  @IsIn(['public', 'authenticated', 'verified_candidates', 'private'])
  visibility?: 'public' | 'authenticated' | 'verified_candidates' | 'private';

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  emailContactEnabled?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  inAppContactEnabled?: boolean;
}
