import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CandidateCertificationResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b' })
  candidateId: string;

  @ApiProperty({ example: 'AWS Certified Solutions Architect – Associate' })
  title: string;

  @ApiProperty({ example: 'Amazon Web Services (AWS)' })
  organization: string;

  @ApiProperty({ example: '2025-05-15T00:00:00.000Z' })
  issueDate: Date;

  @ApiPropertyOptional({ example: '2028-05-15T00:00:00.000Z', nullable: true })
  expirationDate: Date | null;

  @ApiPropertyOptional({ example: 'AWS-ASA-12345', nullable: true })
  credentialId: string | null;

  @ApiPropertyOptional({ example: 'https://www.credly.com/cert/12345', nullable: true })
  credentialUrl: string | null;

  @ApiProperty({ example: '2026-06-05T15:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-05T15:00:00.000Z' })
  updatedAt: Date;
}