import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAccountDto {
  @IsOptional({})
  @ApiPropertyOptional({ example: 'Prince@gmail.com' })
  @IsEmail()
  email?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'current_password' })
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'new_password' })
  @IsString()
  @MinLength(8)
  newPassword?: string;
}