// src/modules/candidate-profile/candidateProfiles.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { UpdateUserCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Injectable()
export class CandidateProfilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findProfileByUserId(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true,
      },
    });
  }

  async updateCandidateProfile(userId: string, dto: UpdateUserCandidateProfileDto) {
    const { fullName, avatar, birthDate, ...profileFields } = dto;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName,        
        avatar,
        candidateProfile: {
          update: {
            ...profileFields,
            birthDate: birthDate ? new Date(birthDate) : undefined,
          },
        },
      },
      include: {
        candidateProfile: true,
      },
    });
  }
  async findUserByEmail(email: string) {
  return this.prisma.user.findUnique({
    where: { email },
  });
}
async updateUserAccount(
    userId: string,
    data: any,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

async findById(id: string) {
  return this.prisma.candidateProfile.findUnique({
    where: { id },
  });
}
}