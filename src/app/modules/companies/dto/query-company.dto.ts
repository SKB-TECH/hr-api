import {
  IsOptional,
  IsString,
  IsInt,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryCompanyDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiPropertyOptional({
    example: 'Nomad',
    description: 'Search by company name or keyword in description',
  })
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiPropertyOptional({
    example: 'Paris, France',
    description: 'Filter by location',
  })
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiPropertyOptional({
    example: 'Design',
    description: 'Filter by industry/category',
  })
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({
    example: 'startup',
    description: 'Filter by company size',
  })
  companySize?: string;

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
  @ApiPropertyOptional({ example: 12, default: 12 })
  limit?: number = 12;
}
