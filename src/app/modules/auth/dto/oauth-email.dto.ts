import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class OAuthEmailDto {
  @IsString()
  @Length(1, 200)
  ticket: string;

  @IsEmail()
  @MaxLength(320)
  email: string;
}

export class VerifyOAuthEmailDto {
  @IsString()
  @Length(1, 200)
  ticket: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
