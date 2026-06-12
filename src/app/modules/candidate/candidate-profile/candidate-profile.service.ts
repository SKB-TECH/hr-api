import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { UpdateUserCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { StorageService } from '@/libs/storage/storage.service';
import { User } from '@/app/modules/users/entities/user.entity';
import { CandidateProfile } from './entities/candidate-profile.entity';

@Injectable()
export class CandidateProfilesService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepo: Repository<CandidateProfile>,
    private readonly dataSource: DataSource,
    private readonly storage: StorageService,
  ) {}

  async findProfileByUserId(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: { candidateProfile: true },
    });
  }

  async findUserByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  async updateUserAccount(userId: string, data: any) {
    await this.userRepo.update(userId, data);
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async findById(id: string) {
    return this.candidateProfileRepo.findOne({ where: { id } });
  }

  async getCandidateProfile(userId: string) {
    const userWithProfile = await this.findProfileByUserId(userId);
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
    const existingUser = await this.findProfileByUserId(userId);
    if (!existingUser) {
      throw new NotFoundException(
        'Candidate profile record could not be found.',
      );
    }

    if (file) {
      const previousAvatar = existingUser.avatar;
      const uploadResult = await this.storage.uploadImage(
        file,
        'avatars',
        userId,
      );
      dto.avatar = uploadResult.url;

      if (previousAvatar) {
        await this.storage.deleteByUrl(previousAvatar).catch(() => {});
      }
    }

    const { fullName, avatar, birthDate, ...profileFields } = dto;

    await this.dataSource.transaction(async (manager) => {
      const userPatch: Partial<User> = {};
      if (fullName !== undefined) userPatch.fullName = fullName;
      if (avatar !== undefined) userPatch.avatar = avatar;
      if (Object.keys(userPatch).length > 0) {
        await manager.update(User, userId, userPatch);
      }

      const profilePatch: any = { ...profileFields };
      if (birthDate !== undefined) {
        profilePatch.birthDate = birthDate ? new Date(birthDate) : undefined;
      }
      if (Object.keys(profilePatch).length > 0) {
        await manager.update(CandidateProfile, { userId }, profilePatch);
      }
    });

    return this.getCandidateProfile(userId);
  }
}
