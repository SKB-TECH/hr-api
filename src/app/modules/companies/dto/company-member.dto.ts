import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AddCompanyMemberDto {
  @ApiProperty({ example: 'recruiter@company.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ example: 'Talent Partner' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiProperty({ enum: ['HR_MANAGER', 'RECRUITER'] })
  @IsIn(['HR_MANAGER', 'RECRUITER'])
  role: 'HR_MANAGER' | 'RECRUITER';
}

export class AcceptCompanyInvitationDto {
  @ApiProperty({ description: 'One-time token received by email' })
  @IsString()
  token: string;
}

export class UpdateCompanyMemberDto {
  @ApiPropertyOptional({ example: 'Senior Talent Partner' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ enum: ['HR_MANAGER', 'RECRUITER'] })
  @IsOptional()
  @IsIn(['HR_MANAGER', 'RECRUITER'])
  role?: 'HR_MANAGER' | 'RECRUITER';
}
