import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetPasswordVerifyDto {
  @ApiProperty({ example: 'CurrentPass123', description: 'Current password' })
  @IsString()
  currentPassword: string;
}
