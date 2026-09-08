import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Profession selected from GET /references/professions' })
  @IsUUID('4')
  professionId: string;

  @ApiProperty({
    example: true,
    description: 'Must accept terms and conditions',
  })
  @IsBoolean()
  acceptTerms: boolean;
}
