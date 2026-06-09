import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { CandidateExperienceRepository } from './candidate-experience.repository';
import { CreateCandidateExperienceDto } from './dto/create-candidate-experience.dto';
import { ExperienceNotFoundException } from './dto/experience-not-found.dto';
import { CandidateProfilesRepository } from '@/modules/candidate/candidate-profile/candidateProfiles.repository';

@Injectable()
export class CandidateExperienceService {
  private readonly logger = new Logger(CandidateExperienceService.name);

  constructor(
    private readonly repository: CandidateExperienceRepository,
    private readonly candidateProfileRepository: CandidateProfilesRepository,
  ) {}


  private async getProfileOrThrow(userId: string) {
    try {
      const result = await this.candidateProfileRepository.findProfileByUserId(userId);
      if (!result) {
        throw new BadRequestException('Candidate account not found');
      }

      const profile = 'candidateProfile' in result && result.candidateProfile 
        ? result.candidateProfile 
        : (result as any);
      
      if (!profile || !profile.id) {
        throw new BadRequestException('Candidate profile registration is missing');
      }

      return profile;
    } catch (error:any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to fetch profile for user ${userId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An error occurred while verifying your profile account');
    }
  }


  private validateDates(startDate?: string | Date, endDate?: string | Date | null, isCurrent?: boolean) {
    if (!startDate) return;

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Provided start date is invalid');
    }

    if (isCurrent && endDate) {
      throw new BadRequestException('Current job cannot have an end date');
    }

    if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        throw new BadRequestException('Provided end date is invalid');
      }
      if (end < start) {
        throw new BadRequestException('End date cannot be before start date');
      }
    }
  }

  private async validateOwnership(experienceId: string, profileId: string) {
    const experience = await this.repository.findByIdAndCandidate(experienceId, profileId);

    if (!experience) {
      throw new ExperienceNotFoundException();
    }

    return experience;
  }


  async create(userId: string, dto: CreateCandidateExperienceDto) {
    this.validateDates(dto.startDate, dto.endDate, dto.isCurrent);

    const profile = await this.getProfileOrThrow(userId);

    try {
      const experience = await this.repository.create({
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        candidate: {
          connect: { id: profile.id },
        },
      });

      return {
        success: true,
        message: 'Experience created successfully',
        data: experience,
      };
    } catch (error:any) {
      this.logger.error(`Failed to create experience for profile ${profile.id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create experience record');
    }
  }


  async findAll(userId: string) {
    const profile = await this.getProfileOrThrow(userId);
    
    try {
      const experiences = await this.repository.findAllByCandidate(profile.id);
      return {
        
        experiences,
      };
    } catch (error:any) {
      this.logger.error(`Failed to retrieve experiences for profile ${profile.id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch experience records');
    }
  }


  async findOne(id: string, userId: string) {
    const profile = await this.getProfileOrThrow(userId);
    const experience = await this.validateOwnership(id, profile.id);

    return {
      success: true,
      data: experience,
    };
  }


  async update(id: string, userId: string, dto: Partial<CreateCandidateExperienceDto>) {
    const profile = await this.getProfileOrThrow(userId);
    const existingExperience = await this.validateOwnership(id, profile.id);

    const mergedStartDate = dto.startDate !== undefined ? dto.startDate : existingExperience.startDate;
    const mergedEndDate = dto.endDate !== undefined ? dto.endDate : existingExperience.endDate;
    const mergedIsCurrent = dto.isCurrent !== undefined ? dto.isCurrent : existingExperience.isCurrent;

    this.validateDates(mergedStartDate, mergedEndDate, mergedIsCurrent);

    try {
      const updated = await this.repository.update(id, {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate !== undefined ? (dto.endDate ? new Date(dto.endDate) : null) : undefined,
      });

      return {
        success: true,
        message: 'Experience updated successfully',
        data: updated,
      };
    } catch (error:any) {
      this.logger.error(`Failed to update experience ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to update experience record');
    }
  }

  async remove(id: string, userId: string) {
    const profile = await this.getProfileOrThrow(userId);
    await this.validateOwnership(id, profile.id);

    try {
      await this.repository.delete(id);
      return {
        success: true,
        message: 'Experience deleted successfully',
      };
    } catch (error:any) {
      this.logger.error(`Failed to delete experience ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to remove experience record');
    }
  }

  async findPublicExperiences(idOrUserId: string) {
    let profile: any = null;

    const directProfile = await this.candidateProfileRepository.findById(idOrUserId);

    if (directProfile) {
      profile = directProfile;
    } else {
      const userWrapper = await this.candidateProfileRepository.findProfileByUserId(idOrUserId);
      if (userWrapper && userWrapper.candidateProfile) {
        profile = userWrapper.candidateProfile;
      }
    }

    if (!profile) {
      throw new ExperienceNotFoundException();
    }

    if (profile.profileVisibility === 'private') {
      throw new ForbiddenException('This profile is private');
    }

    try {
      const experiences = await this.repository.findPublicByCandidate(profile.id);

      return {
       
        experience:experiences.map((exp) => ({
          companyName: exp.companyName,
          position: exp.position,
          employmentType: exp.employmentType,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrent: exp.isCurrent,
          description: exp.description,
        })),
      };
    } catch (error: any) {
      this.logger.error(`Failed to retrieve public experiences for profile ${profile.id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch public experience records');
    }
  }

}