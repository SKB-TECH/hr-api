import { PartialType } from '@nestjs/swagger';
import { AddCandidateSkillDto } from './create-candidate-skill.dto';

export class UpdateCandidateSkillDto extends PartialType(AddCandidateSkillDto) {}
