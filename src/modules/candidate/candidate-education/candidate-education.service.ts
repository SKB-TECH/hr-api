import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CandidateEducationRepository } from './candidate-education.repository';

import { validate as isUuid } from 'uuid';


@Injectable()
export class CandidateEducationService {
  constructor(private readonly edurepo: CandidateEducationRepository) {}

  async add(userId: string, dto: any) {
    const profile = await this.edurepo.getProfileByUserId(userId);
    if (!profile) throw new NotFoundException('Profile not found');
    return this.edurepo.create(profile.id, dto);
  }

  async getAll(userId: string) {
    
    const profile = await this.edurepo.getProfileByUserId(userId);
    return profile ? this.edurepo.findMany(profile.id) : [];
  }

 async getByCandidateId(candidateId: string) {
    return this.edurepo.findMany(candidateId);
  }

  async patch(userId: string, id: string, dto: any) {
    await this.verifyOwnership(userId, id);
    return this.edurepo.update(id, dto);
  }

  async remove(userId: string, id: string) {
    await this.verifyOwnership(userId, id);
    return this.edurepo.delete(id);
  }

  private async verifyOwnership(userId: string, id: string) {
    const education = await this.edurepo.findById(id);
    const profile = await this.edurepo .getProfileByUserId(userId);
    if (!education || education.candidateId !== profile?.id) {
      throw new ForbiddenException('You do not have permission to to changes to this education record');
    }
  }
}