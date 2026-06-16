import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateCandidateCertificationDto {
  @ApiProperty({
    example: 'AWS Certified Solutions Architect – Associate',
    description: 'Name of the certification',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @ApiProperty({
    example: 'Amazon Web Services (AWS)',
    description: 'Organization that issued the certification',
  })
  @IsString({ message: 'Organization must be a string' })
  @IsNotEmpty({ message: 'Organization is required' })
  organization: string;

  @ApiProperty({
    example: '2025-05-15',
    description: 'The date the certification was issued',
  })
  @IsDateString()
  @IsNotEmpty({ message: 'Issue date is required' })
  issueDate: string;

  @ApiPropertyOptional({
    example: '2028-05-15',
    description: 'The date the certification expires',
  })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional({
    example: 'AWS-ASA-12345',
    description: 'The credential ID of the certification',
  })
  @IsString({ message: 'Credential ID must be a string' })
  @IsOptional()
  credentialId?: string;

  @ApiPropertyOptional({
    example: 'https://www.credly.com/cert/12345',
    description: 'The public verification URL',
  })
  @IsUrl()
  @IsOptional()
  credentialUrl?: string;
}
