import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHeroDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'Hero Background Image' })
  file: any;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
