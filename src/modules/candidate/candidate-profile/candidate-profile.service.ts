import { Injectable, NotFoundException } from '@nestjs/common';

import { CandidateProfilesRepository } from './candidateProfiles.repository';
import { UpdateUserCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service'; 

@Injectable()
export class CandidateProfilesService {
  constructor(
    private readonly profilesRepository: CandidateProfilesRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService, 
  ) {}

  async getCandidateProfile(userId: string) {
    const userWithProfile = await this.profilesRepository.findProfileByUserId(userId);
    if (!userWithProfile) {
      throw new NotFoundException('User profile record could not be found.');
    }
    const { password, ...sanitizedUser } = userWithProfile;
    return sanitizedUser;
  }

  async updateCandidateProfile(
    userId: string, 
    dto: UpdateUserCandidateProfileDto,
    file?: any,
  ) {
    const existingUser = await this.profilesRepository.findProfileByUserId(userId);
    if (!existingUser || !existingUser.candidateProfile) {
      throw new NotFoundException('Candidate profile record could not be found.');
    }

    if (file) {
      let oldPublicId = '';
      
      if (existingUser.avatar && existingUser.avatar.includes('cloudinary.com')) {
        const urlParts = existingUser.avatar.split('/');
        const fileWithExtension = urlParts[urlParts.length - 1];
        const folderName = urlParts[urlParts.length - 2];
        const publicIdWithoutExtension = fileWithExtension.split('.')[0];
        
        oldPublicId = `${folderName}/${publicIdWithoutExtension}`;
      }

      const uploadResult = await this.cloudinaryService.replaceFile(file, oldPublicId, 'infinity_profiles_images');
      dto.avatar = uploadResult.secure_url;
    }

    delete (dto as any).avatarFile;
    
    const { skillIds, ...profileData } = dto;
    const updatedUser = await this.profilesRepository.updateCandidateProfile(userId, profileData);
    if (skillIds) {
      await this.prisma.candidateSkill.deleteMany({
        where: { candidateId: existingUser.candidateProfile.id },
      });

      if (skillIds.length > 0) {
        await this.prisma.candidateSkill.createMany({
          data: skillIds.map((id) => ({
            candidateId: existingUser.candidateProfile.id,
            skillId: id,
          })),
        });
      }

      const updatedSkills = await this.prisma.candidateSkill.findMany({
        where: { candidateId: existingUser.candidateProfile.id },
        select: {
          skill: { select: { id: true, name: true, category: true } },
        },
      });
      
      (updatedUser as any).skills = updatedSkills.map(s => s.skill);
    }

    const { password, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }
}