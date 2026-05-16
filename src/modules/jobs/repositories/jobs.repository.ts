import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { JobApplication } from '../entities/job-application.entity';

@Injectable()
export class JobsRepository {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,

    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
  ) {}

  // ── JOBS ──────────────────────────────────────────────────────────────────

  findAll(): Promise<Job[]> {
    return this.jobRepo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Job> {
    const job = await this.jobRepo.findOne({ where: { id, isActive: true } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  create(data: Partial<Job>): Promise<Job> {
    return this.jobRepo.save(this.jobRepo.create(data));
  }

  async update(id: string, data: Partial<Job>): Promise<Job> {
    await this.findById(id);
    await this.jobRepo.update(id, data);
    return this.jobRepo.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.jobRepo.update(id, { isActive: false });
  }

  // ── APPLICATIONS ──────────────────────────────────────────────────────────

  saveApplication(data: Partial<JobApplication>): Promise<JobApplication> {
    return this.applicationRepo.save(this.applicationRepo.create(data));
  }
}
