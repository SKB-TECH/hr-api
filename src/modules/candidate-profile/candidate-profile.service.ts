// src/modules/candidate-profile/candidate-profile.service.ts
import { Injectable, NotFoundException, BadRequestException,ConflictException, } from '@nestjs/common';

import { CandidateProfilesRepository } from './candidateProfiles.repository';
import { UpdateUserCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { UpdateAccountDto } from './dto/update_candidate_email_password';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CandidateProfilesService {
  constructor(
    private readonly profilesRepository: CandidateProfilesRepository,
    private readonly cloudinaryService: CloudinaryService,
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

      const uploadResult = await this.cloudinaryService.replaceFile(file, oldPublicId, 'infinity_profile_images');
      dto.avatar = uploadResult.secure_url;
    }

    delete (dto as any).avatarFile;
    
    const updatedUser = await this.profilesRepository.updateCandidateProfile(userId, dto);
    
    const { password, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }
async updateAccount(
  userId: string,
  dto: UpdateAccountDto,
) {
  const user = await this.profilesRepository.findProfileByUserId(userId);

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const updateData: Record<string, any> = {};

 
   //EMAIL UPDATE 
  
  if (dto.email) {
    const existingUser =
      await this.profilesRepository.findUserByEmail(dto.email);

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Email already exists');
    }

    updateData.email = dto.email;
    updateData.emailVerified = false;
  }

 // PASSWORD UPDATE
  if (dto.newPassword) {
    if (!dto.currentPassword) {
      throw new BadRequestException(
        'Current password is required',
      );
    }

    const isValidPassword = await bcrypt.compare(
      dto.currentPassword,
      user.password ?? '',
    );

    if (!isValidPassword) {
      throw new BadRequestException(
        'Current password is incorrect',
      );
    }

    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      user.password ?? '',
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    updateData.password = await bcrypt.hash(
      dto.newPassword,
      10,
    );
  }

  
  if (Object.keys(updateData).length === 0) {
    throw new BadRequestException(
      'No account information provided',
    );
  }

  await this.profilesRepository.updateUserAccount(
    userId,
    updateData,
  );

  return {
    message: 'Account updated successfully',
  };
}

}