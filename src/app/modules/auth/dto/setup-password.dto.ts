import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupPasswordDto {
  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
