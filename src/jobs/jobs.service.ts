import { Injectable } from '@nestjs/common';

@Injectable()
export class JobsService {
  private readonly latestJobs = [
    {
      id: 1,
      title: 'Frontend Developer',
      location: 'Manchester, UK',
      salaryRange: '£40000 - £65000 per annum',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      link: '/jobs/1'
    },
    {
      id: 2,
      title: 'Frontend Developer',
      location: 'Manchester, UK',
      salaryRange: '£40000 - £65000 per annum',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      link: '/jobs/2'
    }
  ];

  findAllLatest() {
    return this.latestJobs;
  }
}