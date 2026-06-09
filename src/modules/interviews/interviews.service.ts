import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { AddFeedbackDto } from './dto/add-feedback.dto';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInterviewDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.interview.create({ data: dto });
  }

  async findByApplication(applicationId: string) {
    return this.prisma.interview.findMany({
      where: { applicationId },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findByCompany(companyId: string) {
    return this.prisma.interview.findMany({
      where: { companyId },
      orderBy: { scheduledAt: 'asc' },
      include: {
        application: {
          select: {
            fullName: true,
            job: { select: { title: true } },
          },
        },
      },
    });
  }

  async addFeedback(id: string, dto: AddFeedbackDto) {
    const interview = await this.prisma.interview.findUnique({ where: { id } });
    if (!interview) throw new NotFoundException('Interview not found');

    return this.prisma.interview.update({
      where: { id },
      data: { feedback: dto.feedback, status: 'COMPLETED' },
    });
  }
}
