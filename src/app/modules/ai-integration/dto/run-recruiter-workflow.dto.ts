import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class RunRecruiterWorkflowDto {
  @ApiProperty({
    example:
      'Find the 5 best candidates, explain their match and prepare interview questions.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  request: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 20, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}
