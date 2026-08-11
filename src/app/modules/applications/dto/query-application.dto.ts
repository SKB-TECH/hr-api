import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryApplicationDto {
  @IsOptional()
  @IsUUID('4')
  @ApiPropertyOptional({ format: 'uuid' })
  stageId?: string;

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
  @Max(100)
  @ApiPropertyOptional({ example: 10, default: 10 })
  limit?: number = 10;
}
