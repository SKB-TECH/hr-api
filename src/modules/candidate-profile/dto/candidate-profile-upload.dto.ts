import { ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
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
    type: 'object',
    description: 'Provide all profile parameters here as a single nested JSON object block',
    // 🎨 This pulls the structural reference dynamically and forces Swagger to render a real multi-line JSON editor field!
    oneOf: [{ $ref: getSchemaPath(UpdateUserCandidateProfileDto) }], 
  })
  @IsNotEmpty()
  @IsString()
  data: string;
}