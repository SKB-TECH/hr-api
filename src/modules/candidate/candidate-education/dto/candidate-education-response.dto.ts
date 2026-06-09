import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CandidateEducationResponseDto {
  @ApiProperty({ example: 'uuid-generated-id', description: 'Education ID' })
  id: string;

  @ApiProperty({ example: 'candidate-uuid', description: 'Candidate profile ID' })
  candidateId: string;

  @ApiProperty({ example: 'University of Rwanda' })
  @IsString({ message: 'School name must be a string' })
  @IsNotEmpty({ message: 'School name is required' })
  schoolName: string;

  @ApiProperty({ example: 'Bachelor of Science' })
  @IsString({ message: 'Degree must be a string' })
  @IsNotEmpty({ message: 'Degree is required' })
  
  degree: string;

  @ApiProperty({ example: 'Information Technology' })
  @IsString({ message: 'Field of study must be a string' })
  @IsNotEmpty({ message: 'Field of study is required' })
  fieldOfStudy: string;

  @ApiProperty({ example: '2022-09-01', description: 'Start date' })
  startDate: Date;

  @ApiPropertyOptional({ example: '2026-06-01', nullable: true })
  endDate?: Date | null;

  @ApiPropertyOptional({ example: 'A' })
  grade?: string;

  @ApiPropertyOptional({ example: 'Studied software engineering and AI' })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-06-05T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-05T10:00:00.000Z' })
  updatedAt: Date;
}