import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UpdateUserCandidateProfileDto } from './update-candidate-profile.dto';

export class CandidateProfileUploadDto {
  @ApiPropertyOptional({ 
    type: 'string', 
    format: 'binary', 
    description: 'Select an image file (png, jpg, jpeg) from your storage' 
  })
  @IsOptional()
  avatarFile?: any;

  @ApiProperty({
    description: 'Provide all profile parameters here as a single nested JSON block',
    type: () => UpdateUserCandidateProfileDto, // Hook up your huge list of variables directly here!
  })
  @IsNotEmpty()
  @IsString()
  data: string;
}