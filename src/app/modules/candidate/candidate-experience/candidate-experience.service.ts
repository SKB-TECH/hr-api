import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCandidateExperienceDto } from './dto/create-candidate-experience.dto';
import { ExperienceNotFoundException } from './dto/experience-not-found.dto';
import { CandidateExperience } from './entities/candidate-experience.entity';
import { CandidateProfile } from '@/app/modules/candidate/candidate-profile/entities/candidate-profile.entity';

@Injectable()
export class CandidateExperienceService {
  private readonly logger = new Logger(CandidateExperienceService.name);

  constructor(
    @InjectRepository(CandidateExperience)
    private readonly experienceRepo: Repository<CandidateExperience>,
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepo: Repository<CandidateProfile>,
  ) {}

  private async getProfileOrThrow(userId: string) {
    try {
      const profile = await this.candidateProfileRepo.findOne({
        where: { userId },
      });

      if (!profile) {
        throw new BadRequestException('Candidate account not found');
      }

      if (!profile.id) {
        throw new BadRequestException(
          'Candidate profile registration is missing',
        );
      }

      return profile;
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `Failed to fetch profile for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'An error occurred while verifying your profile account',
      );
    }
  }

  private validateDates(
    startDate?: string | Date,
    endDate?: string | Date | null,
    isCurrent?: boolean,
  ) {
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
    const experience = await this.experienceRepo.findOne({
      where: { id: experienceId, candidateId: profileId },
    });

    if (!experience) {
      throw new ExperienceNotFoundException();
    }

    return experience;
  }

  async create(userId: string, dto: CreateCandidateExperienceDto) {
    this.validateDates(dto.startDate, dto.endDate, dto.isCurrent);

    const profile = await this.getProfileOrThrow(userId);

    try {
      const entity = this.experienceRepo.create({
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        candidateId: profile.id,
      });
      const experience = await this.experienceRepo.save(entity);

      return {
        success: true,
        message: 'Experience created successfully',
        data: experience,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to create experience for profile ${profile.id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to create experience record',
      );
    }
  }

  async findAll(userId: string) {
    const profile = await this.getProfileOrThrow(userId);

    try {
      const experiences = await this.experienceRepo.find({
        where: { candidateId: profile.id },
        order: { startDate: 'DESC' },
      });
      return {
        experiences,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve experiences for profile ${profile.id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch experience records',
      );
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

  async update(
    id: string,
    userId: string,
    dto: Partial<CreateCandidateExperienceDto>,
  ) {
    const profile = await this.getProfileOrThrow(userId);
    const existingExperience = await this.validateOwnership(id, profile.id);

    const mergedStartDate =
      dto.startDate !== undefined
        ? dto.startDate
        : existingExperience.startDate;
    const mergedEndDate =
      dto.endDate !== undefined ? dto.endDate : existingExperience.endDate;
    const mergedIsCurrent =
      dto.isCurrent !== undefined
        ? dto.isCurrent
        : existingExperience.isCurrent;

    this.validateDates(mergedStartDate, mergedEndDate, mergedIsCurrent);

    try {
      const patch: any = {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate:
          dto.endDate !== undefined
            ? dto.endDate
              ? new Date(dto.endDate)
              : null
            : undefined,
      };
      await this.experienceRepo.update(id, patch);
      const updated = await this.experienceRepo.findOne({ where: { id } });

      return {
        success: true,
        message: 'Experience updated successfully',
        data: updated,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to update experience ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to update experience record',
      );
    }
  }

  async remove(id: string, userId: string) {
    const profile = await this.getProfileOrThrow(userId);
    await this.validateOwnership(id, profile.id);

    try {
      await this.experienceRepo.delete(id);
      return {
        success: true,
        message: 'Experience deleted successfully',
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to delete experience ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to remove experience record',
      );
    }
  }

  async findPublicExperiences(idOrUserId: string) {
    let profile: any = null;

    const directProfile = await this.candidateProfileRepo.findOne({
      where: { id: idOrUserId },
    });

    if (directProfile) {
      profile = directProfile;
    } else {
      const userProfile = await this.candidateProfileRepo.findOne({
        where: { userId: idOrUserId },
      });
      if (userProfile) {
        profile = userProfile;
      }
    }

    if (!profile) {
      throw new ExperienceNotFoundException();
    }

    if (profile.profileVisibility === 'private') {
      throw new ForbiddenException('This profile is private');
    }

    try {
      const experiences = await this.experienceRepo.find({
        where: { candidateId: profile.id },
        order: { startDate: 'DESC' },
      });

      return {
        experience: experiences.map((exp) => ({
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
      this.logger.error(
        `Failed to retrieve public experiences for profile ${profile.id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to fetch public experience records',
      );
    }
  }
}
