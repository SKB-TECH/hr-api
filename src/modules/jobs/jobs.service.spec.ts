import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
  EmploymentType,
  JobLevel,
  JobCategory,
  JobStatus,
} from '@prisma/client';
import { JobsService } from './jobs.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JobSortOption } from './dto/query-job.dto';

const mockCompany = {
  id: 'uuid-company-1',
  name: 'Stripe',
  logo: 'https://cdn.example.com/stripe.png',
  location: 'Paris, France',
};

const mockJob = {
  id: 'uuid-job-1',
  title: 'Social Media Assistant',
  location: 'Paris, France',
  employmentType: EmploymentType.FULL_TIME,
  jobLevel: JobLevel.ENTRY_LEVEL,
  category: JobCategory.MARKETING,
  salaryMin: 700,
  salaryMax: 1000,
  salaryCurrency: 'USD',
  applicationsCount: 5,
  capacity: 10,
  applyBefore: new Date('2026-07-31'),
  postedAt: new Date('2026-07-01'),
  company: mockCompany,
};

const mockJobDetail = {
  ...mockJob,
  description: 'We are looking for a Social Media expert.',
  responsibilities: 'Manage social channels.',
  whoYouAre: 'You are passionate about social media.',
  niceToHaves: 'Experience with analytics tools.',
  status: JobStatus.LIVE,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  skills: [{ id: 'uuid-skill-1', name: 'Copywriting' }],
  benefits: [
    {
      id: 'uuid-benefit-1',
      title: 'Full Healthcare',
      description: 'We cover all healthcare.',
    },
  ],
};

const mockPrismaService = {
  job: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated jobs with default page and limit', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should filter by keyword in job title', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ keyword: 'Social Media' });

      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should filter by location', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ location: 'Paris' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by employment type', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({
        employmentType: [EmploymentType.FULL_TIME],
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by multiple employment types', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({
        employmentType: [EmploymentType.FULL_TIME, EmploymentType.REMOTE],
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by category', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({
        category: [JobCategory.MARKETING],
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by job level', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({
        jobLevel: [JobLevel.ENTRY_LEVEL],
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by salary min', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ salaryMin: 700 });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by salary max', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ salaryMax: 3000 });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by salary range (min and max)', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ salaryMin: 700, salaryMax: 3000 });

      expect(result.data).toHaveLength(1);
    });

    it('should sort by newest', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ sort: JobSortOption.NEWEST });

      expect(result.data).toHaveLength(1);
    });

    it('should sort by salary high to low', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ sort: JobSortOption.SALARY_HIGH });

      expect(result.data).toHaveLength(1);
    });

    it('should sort by salary low to high', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ sort: JobSortOption.SALARY_LOW });

      expect(result.data).toHaveLength(1);
    });

    it('should return correct hasNextPage when more pages exist', async () => {
      const jobs = Array.from({ length: 10 }, (_, i) => ({
        ...mockJob,
        id: `uuid-job-${i}`,
      }));
      mockPrismaService.$transaction.mockResolvedValue([jobs, 73]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.totalItems).toBe(73);
      expect(result.meta.totalPages).toBe(8);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should return correct hasPreviousPage on page 2', async () => {
      const jobs = Array.from({ length: 10 }, (_, i) => ({
        ...mockJob,
        id: `uuid-job-${i}`,
      }));
      mockPrismaService.$transaction.mockResolvedValue([jobs, 73]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.meta.hasPreviousPage).toBe(true);
      expect(result.meta.currentPage).toBe(2);
    });

    it('should return empty data when no jobs match filters', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({ keyword: 'nonexistent-job-xyz' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a job with company, skills and benefits', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(mockJobDetail);

      const result = await service.findOne('uuid-job-1');

      expect(result.id).toBe('uuid-job-1');
      expect(result.title).toBe('Social Media Assistant');
      expect(result.skills).toHaveLength(1);
      expect(result.benefits).toHaveLength(1);
      expect(result.company.name).toBe('Stripe');
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for a deleted job', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);

      await expect(service.findOne('uuid-deleted-job')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
