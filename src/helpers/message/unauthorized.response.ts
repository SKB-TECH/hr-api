import { ApiProperty } from '@nestjs/swagger';

export class UnauthorizedErrorDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  message: string;

  @ApiProperty({
    example: ['Unauthorized'],
    description: 'List of error messages',
  })
  errors: string[];

  @ApiProperty({
    example: '2026-06-05T00:35:17.143Z',
    description: 'Timestamp of error',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/v1/resumes',
    description: 'Request path where error happened',
  })
  path: string;
}
