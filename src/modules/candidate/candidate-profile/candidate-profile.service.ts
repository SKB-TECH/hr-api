// src/modules/candidate-profile/candidate-profile.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { CandidateProfilesRepository } from './candidateProfiles.repository';
import { UpdateUserCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service'; 

@Injectable()
export class CandidateProfilesService {
  constructor(
    private readonly profilesRepository: CandidateProfilesRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService, 
  ) {}

  // getting user profile data
  async getCandidateProfile(userId: string) {
    const userWithProfile = await this.profilesRepository.findProfileByUserId(userId);
    if (!userWithProfile) {
      throw new NotFoundException('User profile record could not be found.');
    }
    const { password, ...sanitizedUser } = userWithProfile;
    return sanitizedUser;
  }

  // service to update candidate profile
  async updateCandidateProfile(
    userId: string, 
    dto: UpdateUserCandidateProfileDto,
    file?: any,
  ) {
    const existingUser = await this.profilesRepository.findProfileByUserId(userId);
    // Added a check to ensure candidateProfile actually exists before we try to use its ID
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
      dto.avatar = uploadResult.secure_url;    }

    delete (dto as any).avatarFile;
    const updatedUser = await this.profilesRepository.updateCandidateProfile(userId, dto);
  const { password, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }
}