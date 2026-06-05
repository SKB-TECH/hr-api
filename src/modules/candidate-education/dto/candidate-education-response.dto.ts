import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CandidateEducationResponseDto {
  @ApiProperty({ example: 'uuid-generated-id', description: 'Education ID' })
  id: string;

  @ApiProperty({ example: 'candidate-uuid', description: 'Candidate profile ID' })
  candidateId: string;

  @ApiProperty({ example: 'University of Rwanda' })
  schoolName: string;

  @ApiProperty({ example: 'Bachelor of Science' })
  degree: string;

  @ApiProperty({ example: 'Information Technology' })
  fieldOfStudy: string;

  @ApiProperty({ example: '2022-09-01', description: 'Start date' })
  startDate: Date;

  @ApiPropertyOptional({ example: '2026-06-01', nullable: true })
  endDate?: Date | null;

  @ApiPropertyOptional({ example: 'A' })
  grade?: string;

  @ApiPropertyOptional({ example: 'Studied software engineering and AI' })
  description?: string;

  @ApiProperty({ example: '2026-06-05T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-05T10:00:00.000Z' })
  updatedAt: Date;
}