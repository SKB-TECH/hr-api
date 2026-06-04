import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmploymentType, JobLevel, JobCategory } from '@prisma/client';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { JobSortOption } from './dto/query-job.dto';

const mockJobCard = {
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
  company: {
    id: 'uuid-company-1',
    name: 'Stripe',
    logo: null,
    location: 'Paris, France',
  },
};

const mockPaginatedResult = {
  data: [mockJobCard],
  meta: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const mockJobsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
};

describe('JobsController', () => {
  let controller: JobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: mockJobsService }],
    }).compile();

    controller = module.get<JobsController>(JobsController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated jobs', async () => {
      mockJobsService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll({});

      expect(result).toEqual(mockPaginatedResult);
      expect(mockJobsService.findAll).toHaveBeenCalledWith({});
    });

    it('should forward keyword and location filters to service', async () => {
      mockJobsService.findAll.mockResolvedValue(mockPaginatedResult);

      const query = { keyword: 'Designer', location: 'Berlin' };
      await controller.findAll(query);

      expect(mockJobsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should forward employment type filter to service', async () => {
      mockJobsService.findAll.mockResolvedValue(mockPaginatedResult);

      const query = {
        employmentType: [EmploymentType.FULL_TIME, EmploymentType.REMOTE],
      };
      await controller.findAll(query);

      expect(mockJobsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should forward category and job level filters to service', async () => {
      mockJobsService.findAll.mockResolvedValue(mockPaginatedResult);

      const query = {
        category: [JobCategory.DESIGN],
        jobLevel: [JobLevel.MID_LEVEL],
      };
      await controller.findAll(query);

      expect(mockJobsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should forward salary range filter to service', async () => {
      mockJobsService.findAll.mockResolvedValue(mockPaginatedResult);

      const query = { salaryMin: 700, salaryMax: 3000 };
      await controller.findAll(query);

      expect(mockJobsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should forward sort and pagination to service', async () => {
      mockJobsService.findAll.mockResolvedValue(mockPaginatedResult);

      const query = { sort: JobSortOption.NEWEST, page: 2, limit: 10 };
      await controller.findAll(query);

      expect(mockJobsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should return empty data when no jobs match', async () => {
      mockJobsService.findAll.mockResolvedValue({
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const result = await controller.findAll({ keyword: 'nonexistent' });

      expect(result.data).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a job by id', async () => {
      mockJobsService.findOne.mockResolvedValue(mockJobCard);

      const result = await controller.findOne('uuid-job-1');

      expect(result.id).toBe('uuid-job-1');
      expect(result.title).toBe('Social Media Assistant');
      expect(mockJobsService.findOne).toHaveBeenCalledWith('uuid-job-1');
    });

    it('should propagate NotFoundException from service', async () => {
      mockJobsService.findOne.mockRejectedValue(
        new NotFoundException('Job not found'),
      );

      await expect(controller.findOne('bad-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
