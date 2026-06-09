import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEducationDto {
  @ApiProperty({ example: 'University of Rwanda' })
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @ApiProperty({ example: 'Bachelor of Science' })
  @IsString()
  @IsNotEmpty()
  degree: string;

  @ApiProperty({ example: 'Information Technology' })
  @IsString()
  @IsNotEmpty()
  fieldOfStudy: string;

  @ApiProperty({ example: '2022-09-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'A' })
  @IsOptional()
  @IsString()
  grade?: string;

  @ApiPropertyOptional({ example: 'Studied core CS and software engineering' })
  @IsOptional()
  @IsString()
  description?: string;
}