import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

@Injectable()
export class CandidateProfilesRepository {
  constructor(private prisma: PrismaService) {}

  async getCandidateProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true }, 
    });

    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    return profile.id;
  }
}