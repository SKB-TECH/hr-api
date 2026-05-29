import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class JobsService {
  private readonly allJobs = [
    { id: 1, title: 'Frontend Developer', location: 'Manchester, UK', salaryRange: '£40k - £65k', description: 'React and TypeScript expert.', link: '/jobs/1' },
    { id: 2, title: 'Backend Developer', location: 'London, UK', salaryRange: '£50k - £80k', description: 'NestJS and Node.js specialist.', link: '/jobs/2' },
    { id: 3, title: 'UI/UX Designer', location: 'Remote', salaryRange: '£35k - £55k', description: 'Figma master.', link: '/jobs/3' },
    { id: 4, title: 'DevOps Engineer', location: 'Manchester, UK', salaryRange: '£60k - £90k', description: 'AWS and Docker.', link: '/jobs/4' },
    { id: 5, title: 'Product Manager', location: 'London, UK', salaryRange: '£70k - £95k', description: 'Agile leadership.', link: '/jobs/5' },
  ];

  findAllLatest() {
    return this.allJobs.slice(0, 3);
  }

  findAll(page: number, limit: number) {
    const startIndex = (page - 1) * limit;
    return {
      totalJobs: this.allJobs.length,
      page,
      jobs: this.allJobs.slice(startIndex, startIndex + limit),
    };
  }

  findOne(id: number) {
    const job = this.allJobs.find((job) => job.id === id);
    if (!job) throw new NotFoundException(`Job with ID ${id} not found`);
    return job;
  }
}
