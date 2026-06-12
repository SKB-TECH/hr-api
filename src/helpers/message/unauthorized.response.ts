import { ApiProperty } from '@nestjs/swagger';

export class UnauthorizedErrorDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({
    example: 'Authentication is required to access this resource',
  })
  message: string;

  @ApiProperty({ example: 'UNAUTHORIZED' })
  error: string;
}
