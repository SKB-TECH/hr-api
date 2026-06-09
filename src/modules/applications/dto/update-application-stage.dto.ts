import { IsDecimal, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class UpdateApplicationStageDto {
  @IsEnum(ApplicationStatus)
  @ApiProperty({ enum: ApplicationStatus })
  status: ApplicationStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Strong candidate, moving to interview.' })
  notes?: string;
}

export class UpdateApplicationScoreDto {
  @IsDecimal()
  @ApiProperty({ example: '4.5', description: 'Score between 0 and 5' })
  score: string;
}
