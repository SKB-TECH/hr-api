import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  coverLetter: string;
}