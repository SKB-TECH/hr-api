import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobRequirementType } from '../../../../utils/enums';

export class JobRequirementDto {
  @ApiProperty({ enum: JobRequirementType })
  @IsEnum(JobRequirementType)
  type: JobRequirementType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHardRequirement?: boolean = false;
}
