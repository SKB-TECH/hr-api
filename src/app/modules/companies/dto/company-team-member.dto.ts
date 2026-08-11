import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCompanyTeamMemberDto {
  @ApiProperty({ example: 'Célestin Gardinier' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'CEO & Co-Founder' })
  @IsString()
  @MaxLength(150)
  role: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  linkedin?: string;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class UpdateCompanyTeamMemberDto extends PartialType(
  CreateCompanyTeamMemberDto,
) {}
