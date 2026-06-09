import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CandidateExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}


  async create(data: Prisma.CandidateExperienceCreateInput) {
    return this.prisma.candidateExperience.create({ data });
  }

  async findAllByCandidate(candidateId: string) {
    return this.prisma.candidateExperience.findMany({
      where: { candidateId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.candidateExperience.findUnique({
      where: { id },
    });
  }

  async findByIdAndCandidate(id: string, candidateId: string) {
    return this.prisma.candidateExperience.findFirst({
      where: { id, candidateId },
    });
  }


  async findPublicByCandidate(candidateId: string) {
    return this.prisma.candidateExperience.findMany({
      where: { candidateId },
      orderBy: { startDate: 'desc' },
    });
  }


  async update(id: string, data: Prisma.CandidateExperienceUpdateInput) {
    return this.prisma.candidateExperience.update({
      where: { id },
      data,
    });
  }


  async delete(id: string) {
    return this.prisma.candidateExperience.delete({
      where: { id },
    });
  }
}