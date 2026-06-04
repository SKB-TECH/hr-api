import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationStatus } from '@prisma/client';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

const mockApplication = {
  id: 'uuid-app-1',
  jobId: 'uuid-job-1',
  candidateId: 'uuid-user-1',
  fullName: 'Jake Gyll',
  email: 'jake@email.com',
  status: ApplicationStatus.IN_REVIEW,
  appliedAt: new Date('2026-07-24'),
};

const mockPaginatedResult = {
  data: [mockApplication],
  meta: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const mockApplicationsService = {
  create: jest.fn(),
  findMyApplications: jest.fn(),
  getMyStats: jest.fn(),
  findByJob: jest.fn(),
  findByCompany: jest.fn(),
  findOne: jest.fn(),
  updateStage: jest.fn(),
  updateScore: jest.fn(),
};

describe('ApplicationsController', () => {
  let controller: ApplicationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        { provide: ApplicationsService, useValue: mockApplicationsService },
      ],
    }).compile();

    controller = module.get<ApplicationsController>(ApplicationsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should submit a job application', async () => {
      mockApplicationsService.create.mockResolvedValue(mockApplication);

      const dto = {
        jobId: 'uuid-job-1',
        fullName: 'Jake Gyll',
        email: 'jake@email.com',
      };
      const result = await controller.create(dto as any, { id: 'uuid-user-1' });

      expect(result.id).toBe('uuid-app-1');
      expect(mockApplicationsService.create).toHaveBeenCalledWith(
        dto,
        'uuid-user-1',
      );
    });
  });

  describe('findMyApplications', () => {
    it('should return candidate application history', async () => {
      mockApplicationsService.findMyApplications.mockResolvedValue(
        mockPaginatedResult,
      );

      const result = await controller.findMyApplications(
        { id: 'uuid-user-1' },
        {},
      );

      expect(result).toEqual(mockPaginatedResult);
      expect(mockApplicationsService.findMyApplications).toHaveBeenCalledWith(
        'uuid-user-1',
        {},
      );
    });
  });

  describe('getMyStats', () => {
    it('should return dashboard stats', async () => {
      const stats = {
        totalApplied: 45,
        interviewed: 18,
        statusBreakdown: [],
        recentApplications: [],
      };
      mockApplicationsService.getMyStats.mockResolvedValue(stats);

      const result = await controller.getMyStats({ id: 'uuid-user-1' });

      expect(result.totalApplied).toBe(45);
      expect(result.interviewed).toBe(18);
    });
  });

  describe('findByJob', () => {
    it('should return applicants for a job', async () => {
      mockApplicationsService.findByJob.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findByJob('uuid-job-1', {});

      expect(result).toEqual(mockPaginatedResult);
      expect(mockApplicationsService.findByJob).toHaveBeenCalledWith(
        'uuid-job-1',
        {},
      );
    });
  });

  describe('findByCompany', () => {
    it('should return all applicants for a company', async () => {
      mockApplicationsService.findByCompany.mockResolvedValue(
        mockPaginatedResult,
      );

      const result = await controller.findByCompany('uuid-company-1', {});

      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('updateStage', () => {
    it('should update application hiring stage', async () => {
      mockApplicationsService.updateStage.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.SHORTLISTED,
      });

      const result = await controller.updateStage('uuid-app-1', {
        status: ApplicationStatus.SHORTLISTED,
      });

      expect(result.status).toBe(ApplicationStatus.SHORTLISTED);
    });
  });

  describe('updateScore', () => {
    it('should update applicant score', async () => {
      mockApplicationsService.updateScore.mockResolvedValue({
        ...mockApplication,
        score: 4.5,
      });

      const result = await controller.updateScore('uuid-app-1', {
        score: '4.5',
      });

      expect(result.score).toBe(4.5);
    });
  });
});
