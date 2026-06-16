import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../../utils/enums';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: true,
    description: 'Must accept terms and conditions',
  })
  @IsBoolean()
  acceptTerms: boolean;

  @ApiPropertyOptional({
    enum: [UserRole.CANDIDATE, UserRole.COMPANY_OWNER],
    default: UserRole.CANDIDATE,
    description: 'Job Seeker = CANDIDATE, Company = COMPANY_OWNER',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
