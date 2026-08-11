import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  JobRequirementType,
  JobSkillRequirement,
  ResumeParsingStatus,
} from '@/utils/enums';

export class AiJobSkillDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) category: string | null;
  @ApiProperty({ enum: JobSkillRequirement })
  requirementType: JobSkillRequirement;
  @ApiProperty() isHardRequirement: boolean;
}

export class AiJobRequirementDto {
  @ApiProperty({ enum: JobRequirementType }) type: JobRequirementType;
  @ApiProperty() value: string;
  @ApiProperty() isRequired: boolean;
  @ApiProperty() isHardRequirement: boolean;
}

export class AiJobContextDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) companyId: string;
  @ApiProperty() title: string;
  @ApiProperty() employmentType: string;
  @ApiProperty() jobLevel: string;
  @ApiProperty() category: string;
  @ApiProperty() location: string;
  @ApiProperty() description: string;
  @ApiProperty() responsibilities: string;
  @ApiProperty() whoYouAre: string;
  @ApiPropertyOptional({ nullable: true }) niceToHaves: string | null;
  @ApiProperty({ type: [AiJobSkillDto] }) skills: AiJobSkillDto[];
  @ApiProperty({ type: [AiJobRequirementDto] })
  requirements: AiJobRequirementDto[];
}

export class AiCandidateSkillDto {
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) level: string | null;
  @ApiPropertyOptional({ nullable: true }) yearsExperience: number | null;
}

export class AiCandidateSnapshotDto {
  @ApiPropertyOptional({ format: 'uuid' }) applicationId?: string;
  @ApiProperty({ format: 'uuid' }) candidateUserId: string;
  @ApiProperty({ format: 'uuid', nullable: true })
  candidateProfileId: string | null;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) headline: string | null;
  @ApiPropertyOptional({ nullable: true }) location?: string | null;
  @ApiPropertyOptional({ nullable: true }) availability: string | null;
  @ApiProperty({ type: [AiCandidateSkillDto] }) skills: AiCandidateSkillDto[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  experiences: Record<string, unknown>[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  education: Record<string, unknown>[];
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  certifications: Record<string, unknown>[];
}

export class AiResumeStatusDto {
  @ApiProperty({ format: 'uuid' }) resumeId: string;
  @ApiProperty({ enum: ResumeParsingStatus }) status: ResumeParsingStatus;
}
