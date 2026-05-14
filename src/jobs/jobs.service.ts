import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  // Expanded mock data to test pagination
  private readonly allJobs = [
    { id: 1, title: 'Frontend Developer', location: 'Manchester, UK', salaryRange: '£40k - £65k', description: 'React and TypeScript expert.', link: '/jobs/1' },
    { id: 2, title: 'Backend Developer', location: 'London, UK', salaryRange: '£50k - £80k', description: 'NestJS and Node.js specialist.', link: '/jobs/2' },
    { id: 3, title: 'UI/UX Designer', location: 'Remote', salaryRange: '£35k - £55k', description: 'Figma master.', link: '/jobs/3' },
    { id: 4, title: 'DevOps Engineer', location: 'Manchester, UK', salaryRange: '£60k - £90k', description: 'AWS and Docker.', link: '/jobs/4' },
    { id: 5, title: 'Product Manager', location: 'London, UK', salaryRange: '£70k - £95k', description: 'Agile leadership.', link: '/jobs/5' },
  ];

  // Your existing homepage endpoint
  findAllLatest() {
    return this.allJobs.slice(0, 3);
  }

  // NEW: Get all jobs with basic pagination
  findAll(page: number, limit: number) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    return {
      totalJobs: this.allJobs.length,
      page: page,
      jobs: this.allJobs.slice(startIndex, endIndex)
    };
  }

  // NEW: Get a single job by its ID
  findOne(id: number) {
    const job = this.allJobs.find(job => job.id === id);
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }
}