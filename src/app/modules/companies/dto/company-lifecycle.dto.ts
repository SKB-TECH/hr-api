import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CompanyLifecycleReasonDto {
  @ApiProperty({ example: 'Not using the platform currently' })
  @IsString()
  @MaxLength(500)
  reason: string;
}
