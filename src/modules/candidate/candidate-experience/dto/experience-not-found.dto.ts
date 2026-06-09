import { NotFoundException } from '@nestjs/common';

export class ExperienceNotFoundException extends NotFoundException {
  constructor(message: string = 'Candidate experience not found') {
    super(message);
  }
}