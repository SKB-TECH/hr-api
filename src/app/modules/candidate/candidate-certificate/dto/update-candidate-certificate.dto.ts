import { PartialType } from '@nestjs/swagger';
import { CreateCandidateCertificationDto } from './create-candidate-certificate.dto';

export class UpdateCandidateCertificationDto extends PartialType(
  CreateCandidateCertificationDto,
) {}
