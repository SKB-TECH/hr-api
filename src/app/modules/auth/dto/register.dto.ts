import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../../utils/enums';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: [UserRole.CANDIDATE, UserRole.COMPANY_OWNER],
    default: UserRole.CANDIDATE,
    description: 'Job Seeker = CANDIDATE, Company = COMPANY_OWNER',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role: UserRole = UserRole.CANDIDATE;
}
