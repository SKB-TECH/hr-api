import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateApplicationStageDto {
  @ApiProperty({ description: 'The UUID of the new pipeline stage' })
  @IsUUID()
  stageId: string;

  @ApiPropertyOptional({ description: 'Optional note for the history log' })
  @IsOptional()
  @IsString()
  note?: string;
}
