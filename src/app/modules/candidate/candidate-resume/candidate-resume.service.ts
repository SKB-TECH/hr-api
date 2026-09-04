import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { StorageService } from '@/libs/storage/storage.service';
import { validate as isUuid } from 'uuid';
import { Resume } from './entities/resume.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Injectable()
export class CandidateResumeService {
  constructor(
    @InjectRepository(Resume)
    private readonly resumeRepo: Repository<Resume>,
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepo: Repository<CandidateProfile>,
    private storage: StorageService,
    private dataSource: DataSource,
  ) {}

  private async getCandidateProfileId(userId: string): Promise<string> {
    const profile = await this.candidateProfileRepo.findOne({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    return profile.id;
  }

  async uploadResume(file: any, userId: string, title: string) {
    if (!file) throw new BadRequestException('Resume file is required');
    const candidateId = await this.getCandidateProfileId(userId);

    if (!candidateId) {
      throw new BadRequestException(
        'Candidate profile not found for this user',
      );
    }

    let uploadResult;
    try {
      uploadResult = await this.storage.uploadDocument(
        file,
        'resumes',
        userId,
      );
    } catch (error) {
      throw new InternalServerErrorException('File upload service failed');
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Resume);

        const existingDefault = await repo.findOne({
          where: { candidateId, isDefault: true },
        });

        const newResume = repo.create({
          candidateId,
          title: title?.trim() || file.originalname,
          fileUrl: uploadResult.url,
          publicId: uploadResult.id,
          isDefault: !existingDefault,
        });
        const saved = await repo.save(newResume);

        return {
          id: saved.id,
          candidateId: saved.candidateId,
          title: saved.title,
          fileUrl: saved.fileUrl,
          publicId: saved.publicId,
          isDefault: saved.isDefault,
          parsed: saved.parsed,
          parsingStatus: saved.parsingStatus,
          parsingError: saved.parsingError,
          parsedAt: saved.parsedAt,
          createdAt: saved.createdAt,
        };
      });
    } catch (error) {
      if (uploadResult?.id) {
        await this.storage.deleteFile(uploadResult.id);
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new InternalServerErrorException(
        `Failed to process resume: ${errorMessage}`,
      );
    }
  }

  async getAll(userId: string) {
    if (!isUuid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const candidateId = await this.getCandidateProfileId(userId);
    return this.resumeRepo.find({
      where: { candidateId },
    });
  }

  async setDefault(resumeId: string, userId: string) {
    if (!isUuid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const candidateId = await this.getCandidateProfileId(userId);
    const currentDefault = await this.resumeRepo.findOne({
      where: { candidateId, isDefault: true },
    });
    if (currentDefault && currentDefault.id === resumeId) {
      return currentDefault;
    }
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Resume);
      if (currentDefault && currentDefault.id !== resumeId) {
        await repo.update(currentDefault.id, { isDefault: false });
      }

      await repo.update(resumeId, { isDefault: true });
      return repo.findOne({ where: { id: resumeId } });
    });
  }

  async getDefault(userId: string) {
    if (!isUuid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const candidateId = await this.getCandidateProfileId(userId);
    return this.resumeRepo.findOne({
      where: { candidateId, isDefault: true },
    });
  }

  async getPublicDefault(candidateId: string) {
    if (!isUuid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID');
    }

    const candidateExists = await this.candidateProfileRepo.count({
      where: { id: candidateId },
    });

    if (!candidateExists) {
      throw new NotFoundException('Candidate does not exist');
    }

    const resume = await this.resumeRepo.findOne({
      where: {
        candidateId,
        isDefault: true,
      },
    });

    if (!resume) {
      throw new NotFoundException('Default resume not found');
    }

    return resume;
  }

  async deleteResume(id: string, userId: string) {
    if (!isUuid(id)) {
      throw new BadRequestException('Invalid resume ID format');
    }
    if (!isUuid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const resume = await this.resumeRepo.findOne({
      where: { id },
    });

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }
    const candidateId = await this.getCandidateProfileId(userId);
    if (resume.candidateId !== candidateId) {
      throw new ForbiddenException('You do not own this resume');
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Resume);

      if (resume.isDefault) {
        const nextResume = await repo.findOne({
          where: {
            candidateId: resume.candidateId,
            id: Not(id),
          },
        });

        if (nextResume) {
          await repo.update(nextResume.id, { isDefault: true });
        }
      }

      await this.storage.deleteFile(resume.publicId);

      await repo.delete(id);
      return resume;
    });
  }
}
