import { IsString, IsInt, IsOptional, IsUUID, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PipelineStageItemDto {
  @ApiPropertyOptional({ 
    description: 'The UUID of the stage. Leave blank if creating a brand new stage.',
    example: '123e4567-e89b-12d3-a456-426614174000' 
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ description: 'Name of the stage', example: 'Technical Assessment' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Order on the Kanban board (1, 2, 3...)', example: 2 })
  @IsInt()
  @Min(1)
  order: number;
}

export class UpdatePipelineStagesDto {
  @ApiProperty({ 
    description: 'Array of pipeline stages in their correct order',
    type: [PipelineStageItemDto] 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PipelineStageItemDto) // This forces NestJS to validate each item inside the array!
  stages: PipelineStageItemDto[];
}