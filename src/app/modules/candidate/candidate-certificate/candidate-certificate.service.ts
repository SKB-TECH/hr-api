import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCandidateCertificationDto } from './dto/create-candidate-certificate.dto';
import { CandidateCertification } from './entities/candidate-certification.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Injectable()
export class CandidateCertificationService {
  private readonly logger = new Logger(CandidateCertificationService.name);

  constructor(
    @InjectRepository(CandidateCertification)
    private readonly certificationRepo: Repository<CandidateCertification>,
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepo: Repository<CandidateProfile>,
  ) {}

  private async getCandidateProfileOrThrow(userId: string) {
    const profile = await this.candidateProfileRepo.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException(
        'Candidate profile not found. Please complete your profile initialization first.',
      );
    }
    return profile;
  }

  private validateDates(issueDateStr: string, expirationDateStr?: string) {
    const issueDate = new Date(issueDateStr);

    if (expirationDateStr) {
      const expirationDate = new Date(expirationDateStr);
      if (issueDate > expirationDate) {
        throw new BadRequestException(
          'The certification issue date cannot be after the expiration date.',
        );
      }
    }
  }

  async add(userId: string, dto: CreateCandidateCertificationDto) {
    const profile = await this.getCandidateProfileOrThrow(userId);
    this.validateDates(dto.issueDate, dto.expirationDate);

    try {
      const certification = this.certificationRepo.create({
        candidateId: profile.id,
        title: dto.title,
        organization: dto.organization,
        issueDate: new Date(dto.issueDate),
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : null,
        credentialId: dto.credentialId || null,
        credentialUrl: dto.credentialUrl || null,
      });
      return await this.certificationRepo.save(certification);
    } catch (error: any) {
      this.logger.error(
        `Failed to create certification for candidate ${profile.id}:`,
        error.stack,
      );
      throw new BadRequestException('Could not save certification record.');
    }
  }

  async getAllSelf(userId: string) {
    const profile = await this.getCandidateProfileOrThrow(userId);
    return this.certificationRepo.find({
      where: { candidateId: profile.id },
      order: { issueDate: 'DESC' },
    });
  }

  async getByCandidateId(candidateId: string) {
    const profile = await this.candidateProfileRepo.findOne({
      where: { id: candidateId },
    });

    if (!profile) {
      throw new NotFoundException(
        `Candidate profile with ID ${candidateId} not found.`,
      );
    }

    return this.certificationRepo.find({
      where: { candidateId },
      order: { issueDate: 'DESC' },
    });
  }

  async patch(
    userId: string,
    id: string,
    dto: Partial<CreateCandidateCertificationDto>,
  ) {
    const profile = await this.getCandidateProfileOrThrow(userId);

    const certification = await this.certificationRepo.findOne({
      where: { id },
    });

    if (!certification) {
      throw new NotFoundException(
        `Certification record with ID ${id} not found.`,
      );
    }

    if (certification.candidateId !== profile.id) {
      throw new ForbiddenException(
        'You are not authorized to modify this certification record.',
      );
    }

    const finalIssueDate =
      dto.issueDate || certification.issueDate.toISOString();
    const finalExpirationDate =
      dto.expirationDate !== undefined
        ? dto.expirationDate
        : certification.expirationDate
          ? certification.expirationDate.toISOString()
          : undefined;

    if (dto.issueDate || dto.expirationDate !== undefined) {
      this.validateDates(finalIssueDate, finalExpirationDate);
    }

    try {
      this.certificationRepo.merge(certification, {
        title: dto.title,
        organization: dto.organization,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expirationDate:
          dto.expirationDate === null
            ? null
            : dto.expirationDate
              ? new Date(dto.expirationDate)
              : undefined,
        credentialId:
          dto.credentialId !== undefined ? dto.credentialId : undefined,
        credentialUrl:
          dto.credentialUrl !== undefined ? dto.credentialUrl : undefined,
      });
      return await this.certificationRepo.save(certification);
    } catch (error: any) {
      this.logger.error(`Failed to update certification ${id}:`, error.stack);
      throw new BadRequestException('Could not update certification record.');
    }
  }

  async remove(userId: string, id: string) {
    const profile = await this.getCandidateProfileOrThrow(userId);

    const certification = await this.certificationRepo.findOne({
      where: { id },
    });

    if (!certification) {
      throw new NotFoundException(
        `Certification record with ID ${id} not found.`,
      );
    }

    if (certification.candidateId !== profile.id) {
      throw new ForbiddenException(
        'You are not authorized to delete this certification record.',
      );
    }

    try {
      await this.certificationRepo.delete(id);
      return { success: true, message: 'Certification deleted successfully' };
    } catch (error: any) {
      this.logger.error(`Failed to delete certification ${id}:`, error.stack);
      throw new BadRequestException('Could not delete certification record.');
    }
  }
}
