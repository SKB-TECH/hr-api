import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CandidateExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}


  // Basic CRUD operations for CandidateExperience entity


  // creat method with Prisma create input
  async create(data: Prisma.CandidateExperienceCreateInput) {
    return this.prisma.candidateExperience.create({ data });
  }

  // find all experiences for a candidate, ordered by start date descending
  async findAllByCandidate(candidateId: string) {
    return this.prisma.candidateExperience.findMany({
      where: { candidateId },
      orderBy: { startDate: 'desc' },
    });
  }

  // find experience by ID
  async findById(id: string) {
    return this.prisma.candidateExperience.findUnique({
      where: { id },
    });
  }

  // find experience by ID and candidate ID for ownership validation
  async findByIdAndCandidate(id: string, candidateId: string) {
    return this.prisma.candidateExperience.findFirst({
      where: { id, candidateId },
    });
  }


  // find public experiences for a candidate, ordered by start date descending
  async findPublicByCandidate(candidateId: string) {
    return this.prisma.candidateExperience.findMany({
      where: { candidateId },
      orderBy: { startDate: 'desc' },
    });
  }


  // update experience by ID with provided data
  async update(id: string, data: Prisma.CandidateExperienceUpdateInput) {
    return this.prisma.candidateExperience.update({
      where: { id },
      data,
    });
  }


  // delete experience by ID
  async delete(id: string) {
    return this.prisma.candidateExperience.delete({
      where: { id },
    });
  }
}