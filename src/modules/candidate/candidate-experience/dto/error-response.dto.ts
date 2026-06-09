import { NotFoundException } from '@nestjs/common';

export class ExperienceNotFoundException extends NotFoundException {
  constructor() {
    super({
      success: false,
      message: 'Candidate experience not found',
      error: 'EXPERIENCE_NOT_FOUND',
    });
  }
}