// src/modules/candidate-profile/candidate-profile.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CandidateProfilesRepository } from './candidateProfiles.repository';
import { UpdateUserCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';

@Injectable()
export class CandidateProfilesService {
  constructor(
    private readonly profilesRepository: CandidateProfilesRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ✅ FIXED: Removed unused role property lookup parameter
  async getCandidateProfile(userId: string) {
    const userWithProfile = await this.profilesRepository.findProfileByUserId(userId);
    if (!userWithProfile) {
      throw new NotFoundException('User profile record could not be found.');
    }
    const { password, ...sanitizedUser } = userWithProfile;
    return sanitizedUser;
  }

  // ✅ FIXED: Fixed the comma signature and uncoupled the repository update out of the 'if (file)' block loop
  async updateCandidateProfile(
    userId: string, 
    dto: UpdateUserCandidateProfileDto,
    file?: Express.Multer.File,
  ) {
    const existingUser = await this.profilesRepository.findProfileByUserId(userId);
    if (!existingUser) {
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

      // Replace old storage file and append the cloud secure_url back into our DTO parameter context
      const uploadResult = await this.cloudinaryService.replaceFile(file, oldPublicId, 'infinity_profile_images');
      dto.avatar = uploadResult.secure_url;
    }

    // Explicit cleanup to ensure binary schema references do not seep down into Prisma layout queries
    delete (dto as any).avatarFile;
    
    // ✅ FIXED: Placed this query block outside the if loop statement so text updates without images compile perfectly!
    const updatedUser = await this.profilesRepository.updateCandidateProfile(userId, dto);
    
    const { password, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }
}