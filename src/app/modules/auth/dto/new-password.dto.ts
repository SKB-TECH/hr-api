import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NewPasswordDto {
  @ApiProperty({ example: 'NewPass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ example: 'NewPass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
