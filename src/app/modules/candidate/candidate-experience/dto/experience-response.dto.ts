import { ApiProperty } from '@nestjs/swagger';
import { EmploymentType } from '../../../../../utils/enums';

export class CandidateExperienceResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the experience record',
    example: '45cd2b2f-4f4c-4dbf-9f6a-d270d6b94daf',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the candidate who owns this experience',
    example: '9e89d436-e875-4f4b-af05-8bd07b53c2cb',
  })
  candidateId: string;

  @ApiProperty({
    description: 'Company name where the candidate worked',
    example: 'Google',
  })
  companyName: string;

  @ApiProperty({
    description: 'Job title or position held',
    example: 'Backend Developer',
  })
  position: string;

  @ApiProperty({
    description:
      'Type of employment (FULL_TIME, PART_TIME, CONTRACT, INTERN, etc.)',
    enum: EmploymentType,
    example: EmploymentType.FULL_TIME,
  })
  employmentType: EmploymentType;

  @ApiProperty({
    description: 'Job description and responsibilities',
    example: 'Built scalable REST APIs using NestJS and PostgreSQL.',
    required: false,
    nullable: true,
  })
  description?: string;

  @ApiProperty({
    description: 'Start date of the job',
    example: '2023-01-15T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of the job (null if currently working)',
    example: '2025-06-30T00:00:00.000Z',
    required: false,
    nullable: true,
  })
  endDate?: Date;

  @ApiProperty({
    description: 'Indicates if this is the current job',
    example: false,
  })
  isCurrent: boolean;

  @ApiProperty({
    description: 'Country of the job location',
    example: 'Rwanda',
    required: false,
    nullable: true,
  })
  countryName?: string;

  @ApiProperty({
    description: 'City of the job location',
    example: 'Kigali',
    required: false,
    nullable: true,
  })
  cityName?: string;

  @ApiProperty({
    description: 'Record creation timestamp',
    example: '2026-06-05T14:14:22.176Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2026-06-05T14:14:22.176Z',
  })
  updatedAt: Date;
}
