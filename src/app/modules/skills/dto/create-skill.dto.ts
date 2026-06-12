import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({
    example: 'Node.js',
    description: 'The official name of the skill',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Backend',
    description: 'Optional category for the skill',
  })
  @IsString()
  @IsOptional()
  category?: string;
}
