import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @IsUUID()
  @ApiProperty({ example: 'uuid-job-1', description: 'Job being applied to' })
  jobId: string;

  @IsString()
  @ApiProperty({ example: 'Jake Gyll' })
  fullName: string;

  @IsEmail()
  @ApiProperty({ example: 'jake@email.com' })
  email: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '+44 1245 572 135' })
  phone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Product Designer' })
  currentJobTitle?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'https://linkedin.com/in/jake' })
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'https://jake.com' })
  portfolioUrl?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'I am excited about this role...' })
  coverLetter?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'https://cdn.example.com/resume.pdf' })
  resumeUrl?: string;
}
