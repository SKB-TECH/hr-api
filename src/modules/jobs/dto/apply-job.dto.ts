import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ApplyJobDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(150)
  email: string;

  @IsNotEmpty({ message: 'Contact number is required' })
  @IsString()
  @MaxLength(20)
  contactNumber: string;

  @IsNotEmpty({ message: 'Cover letter is required' })
  @IsString()
  coverLetter: string;
}
