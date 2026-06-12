import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInterviewDto {
  @IsUUID()
  @ApiProperty({ example: 'uuid-application-1' })
  applicationId: string;

  @IsUUID()
  @ApiProperty({ example: 'uuid-company-1' })
  companyId: string;

  @IsString()
  @ApiProperty({ example: 'Written Test' })
  title: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Kathryn Murphy' })
  interviewerName?: string;

  @IsDateString()
  @ApiProperty({ example: '2026-07-10T10:00:00.000Z' })
  scheduledAt: string;

  @IsDateString()
  @ApiProperty({ example: '2026-07-10T11:00:00.000Z' })
  endTime: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Silver Crystal Room, Nomad Office' })
  location?: string;
}
