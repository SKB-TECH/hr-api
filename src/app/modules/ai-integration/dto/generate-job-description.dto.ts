import { IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateJobDescriptionDto {
  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  evidence: Record<string, unknown>;
}
