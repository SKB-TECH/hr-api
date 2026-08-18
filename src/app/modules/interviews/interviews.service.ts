import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { AddFeedbackDto } from './dto/add-feedback.dto';
import { Interview } from './entities/interview.entity';
import { Application } from '../applications/entities/application.entity';
import { InterviewStatus } from '@/utils/enums';
import { CompanyMember } from '../companies/entities/company-member.entity';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(CompanyMember)
    private readonly companyMemberRepo: Repository<CompanyMember>,
  ) {}

  async create(dto: CreateInterviewDto, userId: string) {
    const application = await this.applicationRepo.findOne({
      where: { id: dto.applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.jobId) {
      const applicationWithJob = await this.applicationRepo.findOne({
        where: { id: application.id },
        relations: { job: true },
      });
      if (
        !applicationWithJob ||
        applicationWithJob.job.companyId !== dto.companyId
      )
        throw new ForbiddenException(
          'Application does not belong to this company',
        );
    }
    await this.assertCompanyAccess(dto.companyId, userId);

    return this.interviewRepo.save(this.interviewRepo.create(dto));
  }

  async findByApplication(applicationId: string, userId: string) {
    const application = await this.applicationRepo.findOne({
      where: { id: applicationId },
      relations: { job: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    await this.assertCompanyAccess(application.job.companyId, userId);
    return this.interviewRepo.find({
      where: { applicationId },
      order: { scheduledAt: 'ASC' },
    });
  }

  async findByCompany(companyId: string, userId: string) {
    await this.assertCompanyAccess(companyId, userId);
    return this.interviewRepo.find({
      where: { companyId },
      order: { scheduledAt: 'ASC' },
      relations: { application: { job: true } },
    });
  }

  async addFeedback(id: string, dto: AddFeedbackDto, userId: string) {
    const interview = await this.interviewRepo.findOne({ where: { id } });
    if (!interview) throw new NotFoundException('Interview not found');
    await this.assertCompanyAccess(interview.companyId, userId);

    await this.interviewRepo.update(id, {
      feedback: dto.feedback,
      status: InterviewStatus.COMPLETED,
    });
    return this.interviewRepo.findOne({ where: { id } });
  }

  private async assertCompanyAccess(companyId: string, userId: string) {
    const member = await this.companyMemberRepo.findOne({
      where: { companyId, userId },
      select: { id: true },
    });
    if (!member)
      throw new ForbiddenException(
        'You cannot access interviews outside your company',
      );
  }
}
