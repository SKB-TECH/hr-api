import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class CandidateProfilesRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findProfileByUserId(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true, // Sideloads profile child data natively
      },
    });
  }
}