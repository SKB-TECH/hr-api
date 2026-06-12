import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUuid } from 'uuid';

import { CandidateEducation } from './entities/candidate-education.entity';
import { CandidateProfile } from '@/app/modules/candidate/candidate-profile/entities/candidate-profile.entity';

@Injectable()
export class CandidateEducationService {
  constructor(
    @InjectRepository(CandidateEducation)
    private readonly educationRepo: Repository<CandidateEducation>,
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepo: Repository<CandidateProfile>,
  ) {}

  async getProfileByUserId(userId: string) {
    if (!isUuid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return this.candidateProfileRepo.findOne({ where: { userId } });
  }

  async create(candidateId: string, data: any) {
    if (!isUuid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID format');
    }
    const entity = this.educationRepo.create({
      ...data,
      candidateId,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    });
    return this.educationRepo.save(entity);
  }

  async findMany(candidateId: string) {
    if (!isUuid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID format');
    }
    return this.educationRepo.find({ where: { candidateId } });
  }

  async findById(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid education ID format');
    }
    return this.educationRepo.findOne({ where: { id } });
  }

  async update(id: string, data: any) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    await this.educationRepo.update(id, {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
    });
    return this.educationRepo.findOne({ where: { id } });
  }

  async delete(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    return this.educationRepo.delete(id);
  }

  async add(userId: string, dto: any) {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) throw new NotFoundException('Profile not found');
    return this.create(profile.id, dto);
  }

  async getAll(userId: string) {
    const profile = await this.getProfileByUserId(userId);
    return profile ? this.findMany(profile.id) : [];
  }

  async getByCandidateId(candidateId: string) {
    return this.findMany(candidateId);
  }

  async patch(userId: string, id: string, dto: any) {
    await this.verifyOwnership(userId, id);
    return this.update(id, dto);
  }

  async remove(userId: string, id: string) {
    await this.verifyOwnership(userId, id);
    return this.delete(id);
  }

  private async verifyOwnership(userId: string, id: string) {
    const education = await this.findById(id);
    const profile = await this.getProfileByUserId(userId);
    if (!education || education.candidateId !== profile?.id) {
      throw new ForbiddenException(
        'You do not have permission to to changes to this education record',
      );
    }
  }
}
