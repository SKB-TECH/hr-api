// src/modules/candidate-education/candidate-education.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateEducationDto } from './dto/create-candidate-education.dto';
import { validate as isUuid } from 'uuid';
import { BadRequestException } from '@nestjs/common';


@Injectable()
export class CandidateEducationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // get candidate profile by user ID
  async getProfileByUserId(userId: string) {
    if (!isUuid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    return this.prisma.candidateProfile.findUnique({ where: { userId } });
  }


  // method to create a new education entry for a candidate
  async create(candidateId: string, data: any) {
    if (!isUuid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID format');
    }
    return this.prisma.candidateEducation.create({
      data: {
        ...data,
        candidateId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  // method to find all education entries for a candidate
  async findMany(candidateId: string) {
    if (!isUuid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID format');
    }
    return this.prisma.candidateEducation.findMany({ where: { candidateId } });
  }

  async findById(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid education ID format');
    }
    return this.prisma.candidateEducation.findUnique({ where: { id } });
  }

  async update(id: string, data: any) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    return this.prisma.candidateEducation.update({
      where: { id },
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });
  }

  async delete(id: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    return this.prisma.candidateEducation.delete({ where: { id } });
  }
}