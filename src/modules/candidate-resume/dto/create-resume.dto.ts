import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResumeDto {

  @ApiProperty({
    example: 'Software Engineer Resume',
    description: 'Title of the resume',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Set this resume as default',
  })
  @IsOptional()
  isDefault?: boolean;
}