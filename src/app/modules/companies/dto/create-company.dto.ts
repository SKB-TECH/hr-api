import { IsString, IsOptional, IsUrl, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Infinity Innovation',
    description: 'The official name of the company',
  })
  @IsString()
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
}
