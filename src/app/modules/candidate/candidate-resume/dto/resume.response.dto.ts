import { ApiProperty } from '@nestjs/swagger';

export class ResumeResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'candidate-uuid' })
  candidateId: string;

  @ApiProperty({ example: 'Software Engineer Resume' })
  title: string;

  @ApiProperty({
    example: 'https://storage.googleapis.com/your-bucket/resumes/file.pdf',
  })
  fileUrl: string;

  @ApiProperty({ example: '3a122f42-ed14-4252-9e2a-e0f4a2577320' })
  publicId: string;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty({ example: false })
  parsed: boolean;

  @ApiProperty({ example: '2026-06-05T10:00:00.000Z' })
  createdAt: Date;
}
