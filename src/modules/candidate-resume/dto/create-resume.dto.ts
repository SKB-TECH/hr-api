import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResumeDto {

  @ApiProperty({
    example: 'Software Engineer Resume',
    description: 'Title of the resume',
    required: true,
  })
  @IsString()
  title: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The resume file to upload',
    example:'https://res.cloudinary.com/dphzr2jab/raw/upload/v1780508838/resumes/ekcds0b6baysmnocawfw',
    required: true,
  })
  @IsString()
  file: Express.Multer.File;

  @ApiPropertyOptional({
    example: true,
    description: 'Set this resume as default',
  })
  @IsOptional()
  isDefault?: boolean;
}