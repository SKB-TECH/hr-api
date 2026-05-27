import { Injectable, NotFoundException } from '@nestjs/common';
import { JobsRepository } from './repositories/jobs.repository';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { Job, JobApplication, Prisma } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepository: JobsRepository) {}

  async findAll(): Promise<[Job[], number]> {
    return this.jobsRepository.findAll({
      // Use isPublished instead of isActive based on our Prisma schema
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOne({ id });
    if (!job || !job.isPublished) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async create(dto: CreateJobDto): Promise<Job> {
    return this.jobsRepository.create(dto as unknown as Prisma.JobCreateInput);
  }

  async update(id: string, dto: Partial<CreateJobDto>): Promise<Job> {
    await this.findOne(id); // Ensure it exists
    return this.jobsRepository.update({
      where: { id },
      data: dto as Prisma.JobUpdateInput,
    });
  }

  async remove(id: string): Promise<Job> {
    await this.findOne(id); // Ensure it exists
    return this.jobsRepository.update({
      where: { id },
      data: { isPublished: false }, // Soft delete
    });
  }

  async apply(jobId: string, dto: CreateApplicationDto): Promise<JobApplication> {
    await this.findOne(jobId); // Verify job exists before allowing application
    
    return this.jobsRepository.saveApplication({
      jobId,
      fullName: dto.fullName,
      email: dto.email,
      // Map contactNumber from the DTO to the phone field in Prisma
      phone: dto.contactNumber, 
      coverLetter: dto.coverLetter,
    });
  }
}