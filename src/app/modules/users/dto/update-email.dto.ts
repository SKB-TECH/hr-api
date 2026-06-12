import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailDto {
  @ApiProperty({ example: 'newemail@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
