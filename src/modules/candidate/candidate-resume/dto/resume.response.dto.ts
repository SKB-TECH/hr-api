import { ApiProperty } from '@nestjs/swagger';

export class ResumeResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'candidate-uuid' })
  candidateId: string;

  @ApiProperty({ example: 'Software Engineer Resume' })
  title: string;

  @ApiProperty({ example: 'https://cloudinary.com/file.pdf' })
  fileUrl: string;

  @ApiProperty({ example: 'cloudinary_public_id_123' })
  publicId: string;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty({ example: false })
  parsed: boolean;

  @ApiProperty({ example: '2026-06-05T10:00:00.000Z' })
  createdAt: Date;
}