import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreatePortfolioDto {
  @ApiProperty({
    description: 'The visible name or title of the showcase project',
    example: 'Clinically - clinic & healthcare website',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed breakdown of text accomplishments or framework tools applied',
    example: 'Built using Next.js, TailwindCSS and NestJS backend framework.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'An optional live link to the deployed site or mockup container',
    example: 'https://clinically-demo.dev',
  })
  @IsUrl({}, { message: 'projectUrl must be a valid link URL address' })
  @IsOptional()
  projectUrl?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The portfolio showcase visual image preview file to upload directly to Cloudinary',
  })
  thumbnail: any; // Handled directly via standard multipart/form-data streams
}