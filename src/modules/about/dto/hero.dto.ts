import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class UpdateHeroDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
