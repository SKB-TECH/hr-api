import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CandidateProfilesRepository } from './candidateProfiles.repository';
import { UserRole } from '@prisma/client';

@Injectable()
export class CandidateProfilesService {
  constructor(private readonly profilesRepository: CandidateProfilesRepository) {}
async getCandidateProfile(userId: string, role: UserRole) {
    if (role !== UserRole.CANDIDATE) {
      throw new ForbiddenException('Only candidate profiles.');
    }    
    const userWithProfile = await this.profilesRepository.findProfileByUserId(userId);
    if (!userWithProfile) {
      throw new NotFoundException('User profile record could not be found.');
    }
    const { password, ...sanitizedUser } = userWithProfile;
    return sanitizedUser;
  }
}