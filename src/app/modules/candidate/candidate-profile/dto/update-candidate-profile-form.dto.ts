import { ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateUserCandidateProfileDto } from './update-candidate-profile.dto';

export class UpdateCandidateProfileFormDto extends UpdateUserCandidateProfileDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional avatar image file (png, jpg, jpeg)',
  })
  avatarFile?: any;
}
