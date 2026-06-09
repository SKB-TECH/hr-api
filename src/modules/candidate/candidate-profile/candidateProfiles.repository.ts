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
        candidateProfile: {
          include: {
            // This is the crucial addition: deeply fetching the master skills
            candidate_skills: {
              select: {
                skill: {
                  select: { 
                    id: true, 
                    name: true, 
                    category: true 
                  }
                }
              }
            }
          }
        }
      },
    });
  }

  async updateCandidateProfile(userId: string, dto: UpdateUserCandidateProfileDto) {
    // Extracted phoneNumber to prevent it from bleeding into the profileFields spread
    const { firstName, lastName, avatar, birthDate, phoneNumber, ...profileFields } = dto;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        avatar,
        phone: phoneNumber, // Correctly mapped to the User table's phone column
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