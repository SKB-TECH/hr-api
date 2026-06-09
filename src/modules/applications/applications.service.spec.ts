import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ApplicationStatus } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const mockJob = {
  id: 'uuid-job-1',
  title: 'Social Media Assistant',
  companyId: 'uuid-company-1',
  deletedAt: null,
};

const mockApplication = {
  id: 'uuid-app-1',
  jobId: 'uuid-job-1',
  candidateId: 'uuid-user-1',
  fullName: 'Jake Gyll',
  email: 'jake@email.com',
  phone: '+44 1245 572 135',
  currentJobTitle: 'Product Designer',
  linkedinUrl: null,
  portfolioUrl: null,
  coverLetter: null,
  resumeUrl: null,
  status: ApplicationStatus.IN_REVIEW,
  score: null,
  appliedAt: new Date('2026-07-24'),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  job: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  application: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  applicationStageHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('ApplicationsService', () => {
  let service: ApplicationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      jobId: 'uuid-job-1',
      fullName: 'Jake Gyll',
      email: 'jake@email.com',
    };

    it('should create an application and increment job applicationsCount', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);
      mockPrismaService.application.findUnique.mockResolvedValue(null);
      mockPrismaService.application.create.mockResolvedValue(mockApplication);
      mockPrismaService.job.update.mockResolvedValue({});

      const result = await service.create(dto, 'uuid-user-1');

      expect(result.id).toBe('uuid-app-1');
      expect(mockPrismaService.job.update).toHaveBeenCalledWith({
        where: { id: 'uuid-job-1' },
        data: { applicationsCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, 'uuid-user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when candidate already applied', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);
      mockPrismaService.application.findUnique.mockResolvedValue(
        mockApplication,
      );

      await expect(service.create(dto, 'uuid-user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findMyApplications', () => {
    it('should return paginated applications for candidate', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockApplication], 1]);

      const result = await service.findMyApplications('uuid-user-1', {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.currentPage).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockApplication], 1]);

      const result = await service.findMyApplications('uuid-user-1', {
        status: ApplicationStatus.IN_REVIEW,
      });

      expect(result.data).toHaveLength(1);
    });

    it('should return empty when no applications match', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findMyApplications('uuid-user-1', {
        status: ApplicationStatus.HIRED,
      });

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });
  });

  describe('getMyStats', () => {
    it('should return dashboard stats for candidate', async () => {
      mockPrismaService.$transaction.mockResolvedValue([45, 18, []]);
      mockPrismaService.application.groupBy.mockResolvedValue([
        { status: ApplicationStatus.IN_REVIEW, _count: { status: 34 } },
        { status: ApplicationStatus.INTERVIEWING, _count: { status: 18 } },
      ]);

      const result = await service.getMyStats('uuid-user-1');

      expect(result.totalApplied).toBe(45);
      expect(result.interviewed).toBe(18);
      expect(result.statusBreakdown).toHaveLength(2);
    });
  });

  describe('findByJob', () => {
    it('should return paginated applicants for a job', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockApplication], 19]);

      const result = await service.findByJob('uuid-job-1', {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(19);
    });

    it('should filter by search name', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockApplication], 1]);

      const result = await service.findByJob('uuid-job-1', { search: 'Jake' });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('findByCompany', () => {
    it('should return all applicants across company jobs', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockApplication], 19]);

      const result = await service.findByCompany('uuid-company-1', {});

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(19);
    });
  });

  describe('findOne', () => {
    it('should return application with job and interviews', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        ...mockApplication,
        job: { title: 'Social Media Assistant' },
        interviews: [],
      });

      const result = await service.findOne('uuid-app-1');

      expect(result.id).toBe('uuid-app-1');
      expect(result).toHaveProperty('interviews');
    });

    it('should throw NotFoundException when application does not exist', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStage', () => {
    it('should update the application status', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        ...mockApplication,
        job: {},
        interviews: [],
      });
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.SHORTLISTED,
      });

      mockPrismaService.$transaction.mockResolvedValue([
        { ...mockApplication, status: ApplicationStatus.SHORTLISTED },
        { id: 'uuid-history-1' },
      ]);

      const result = await service.updateStage(
        'uuid-app-1',
        { status: ApplicationStatus.SHORTLISTED },
        'uuid-user-1',
      );

      expect(result[0].status).toBe(ApplicationStatus.SHORTLISTED);
    });

    it('should throw NotFoundException for non-existent application', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStage(
          'bad-id',
          { status: ApplicationStatus.HIRED },
          'uuid-user-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateScore', () => {
    it('should update the applicant score', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        ...mockApplication,
        job: {},
        interviews: [],
      });
      mockPrismaService.application.update.mockResolvedValue({
        ...mockApplication,
        score: 4.5,
      });

      const result = await service.updateScore('uuid-app-1', { score: '4.5' });

      expect(result.score).toBe(4.5);
    });
  });
});
