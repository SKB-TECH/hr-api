import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { AddFeedbackDto } from './dto/add-feedback.dto';
import { Interview } from './entities/interview.entity';
import { Application } from '../applications/entities/application.entity';
import { InterviewStatus } from '@/utils/enums';

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepo: Repository<Interview>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  async create(dto: CreateInterviewDto) {
    const application = await this.applicationRepo.findOne({
      where: { id: dto.applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');

    return this.interviewRepo.save(this.interviewRepo.create(dto));
  }

  async findByApplication(applicationId: string) {
    return this.interviewRepo.find({
      where: { applicationId },
      order: { scheduledAt: 'ASC' },
    });
  }

  async findByCompany(companyId: string) {
    return this.interviewRepo.find({
      where: { companyId },
      order: { scheduledAt: 'ASC' },
      relations: { application: { job: true } },
    });
  }

  async addFeedback(id: string, dto: AddFeedbackDto) {
    const interview = await this.interviewRepo.findOne({ where: { id } });
    if (!interview) throw new NotFoundException('Interview not found');

    await this.interviewRepo.update(id, {
      feedback: dto.feedback,
      status: InterviewStatus.COMPLETED,
    });
    return this.interviewRepo.findOne({ where: { id } });
  }
}
