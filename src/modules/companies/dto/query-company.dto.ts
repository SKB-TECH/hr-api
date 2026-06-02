import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryCompanyDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Nomad',
    description: 'Search by company name or keyword in description',
  })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Paris, France',
    description: 'Filter by location',
  })
  location?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Design',
    description: 'Filter by industry/category',
  })
  industry?: string;

  @IsOptional()
  @IsString()
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
  @ApiPropertyOptional({ example: 12, default: 12 })
  limit?: number = 12;
}
