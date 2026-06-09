import { PartialType } from '@nestjs/swagger';
import { CreateCandidateExperienceDto } from './create-candidate-experience.dto';

export class UpdateCandidateExperienceDto extends PartialType(
  CreateCandidateExperienceDto,
) {}