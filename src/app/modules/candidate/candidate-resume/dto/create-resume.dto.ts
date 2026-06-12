import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateResumeDto {
  @ApiProperty({
    example: 'Software Engineer Resume',
    description: 'Title of the resume',
    required: true,
  })
  @IsString({ message: 'Title must be a string' })
  title: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The resume file to upload',
    example:
      'https://storage.googleapis.com/your-bucket/resumes/3a122f42-ed14-4252-9e2a-e0f4a2577320.pdf',
    required: true,
  })
  @IsString({ message: 'File is required' })
  file: Express.Multer.File;

  @ApiPropertyOptional({
    example: true,
    description: 'Set this resume as default',
  })
  @IsOptional()
  isDefault?: boolean;
}
