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
        candidateProfile: {
          include: {
            candidateSkills: {
              select: {
                skill: {
                  select: { id: true, name: true, slug: true }
                }
              }
            }
          }
        }
      },
    });
  }

  async updateCandidateProfile(userId: string, dto: UpdateUserCandidateProfileDto) {
    const { fullName, avatar, birthDate, phoneNumber, ...profileFields } = dto;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        avatar,
        phone: phoneNumber,
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

  async updateUserAccount(userId: string, data: any) {
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