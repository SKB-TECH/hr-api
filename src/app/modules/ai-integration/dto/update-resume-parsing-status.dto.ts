import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResumeParsingStatus } from '@/utils/enums';

export class UpdateResumeParsingStatusDto {
  @ApiProperty({ enum: ResumeParsingStatus })
  @IsEnum(ResumeParsingStatus)
  status: ResumeParsingStatus;

  @ApiPropertyOptional({
    description: 'Sanitized technical summary; never include CV content.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  error?: string;
}
