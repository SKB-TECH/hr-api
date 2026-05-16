import { Injectable, NotFoundException } from '@nestjs/common';
import { JobsRepository } from './repositories/jobs.repository';
import { CreateJobDto, UpdateJobDto } from './dto/job.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
import { Job } from './entities/job.entity';
import { JobApplication } from './entities/job-application.entity';

@Injectable()
export class JobsService {
  constructor(private readonly jobsRepository: JobsRepository) {}

  // ── JOBS ──────────────────────────────────────────────────────────────────

  getAll(): Promise<Job[]> {
    return this.jobsRepository.findAll();
  }

  async getById(id: string): Promise<Job> {
    const job = await this.jobsRepository.findById(id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  createJob(dto: CreateJobDto): Promise<Job> {
    return this.jobsRepository.create(dto);
  }

  updateJob(id: string, dto: UpdateJobDto): Promise<Job> {
    return this.jobsRepository.update(id, dto);
  }

  deleteJob(id: string): Promise<void> {
    return this.jobsRepository.delete(id);
  }

  // ── APPLICATIONS ──────────────────────────────────────────────────────────

  async applyForJob(jobId: string, dto: ApplyJobDto): Promise<JobApplication> {
    await this.jobsRepository.findById(jobId);
    return this.jobsRepository.saveApplication({ ...dto, jobId });
  }
}
