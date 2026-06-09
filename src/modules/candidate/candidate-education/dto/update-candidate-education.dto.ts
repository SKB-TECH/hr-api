import { PartialType } from '@nestjs/swagger';
import { CreateEducationDto } from './create-candidate-education.dto';

export class UpdateCandidateEducationDto extends PartialType(CreateEducationDto) {}
