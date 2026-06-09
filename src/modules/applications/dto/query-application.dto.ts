import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ApplicationStatus } from '@prisma/client';

export class QueryApplicationDto {
  @IsOptional()
  @IsEnum(ApplicationStatus)
  @ApiPropertyOptional({
    enum: ApplicationStatus,
    description: 'Filter by application status',
  })
  status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Jake',
    description: 'Search by applicant name',
  })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 1, default: 1 })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ example: 10, default: 10 })
  limit?: number = 10;
}
