import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InterviewStatus } from '@prisma/client';
import { InterviewsService } from './interviews.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const mockInterview = {
  id: 'uuid-interview-1',
  applicationId: 'uuid-app-1',
  companyId: 'uuid-company-1',
  title: 'Written Test',
  interviewerName: 'Kathryn Murphy',
  scheduledAt: new Date('2026-07-10T10:00:00.000Z'),
  endTime: new Date('2026-07-10T11:00:00.000Z'),
  location: 'Silver Crystal Room, Nomad',
  status: InterviewStatus.SCHEDULED,
  feedback: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  application: { findUnique: jest.fn() },
  interview: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('InterviewsService', () => {
  let service: InterviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InterviewsService>(InterviewsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = {
      applicationId: 'uuid-app-1',
      companyId: 'uuid-company-1',
      title: 'Written Test',
      scheduledAt: '2026-07-10T10:00:00.000Z',
      endTime: '2026-07-10T11:00:00.000Z',
    };

    it('should schedule an interview', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue({
        id: 'uuid-app-1',
      });
      mockPrismaService.interview.create.mockResolvedValue(mockInterview);

      const result = await service.create(dto);

      expect(result.id).toBe('uuid-interview-1');
      expect(result.title).toBe('Written Test');
    });

    it('should throw NotFoundException when application does not exist', async () => {
      mockPrismaService.application.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByApplication', () => {
    it('should return interviews for an applicant ordered by date', async () => {
      mockPrismaService.interview.findMany.mockResolvedValue([mockInterview]);

      const result = await service.findByApplication('uuid-app-1');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Written Test');
    });

    it('should return empty array when no interviews exist', async () => {
      mockPrismaService.interview.findMany.mockResolvedValue([]);

      const result = await service.findByApplication('uuid-app-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByCompany', () => {
    it('should return all company interviews for the schedule', async () => {
      mockPrismaService.interview.findMany.mockResolvedValue([mockInterview]);

      const result = await service.findByCompany('uuid-company-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('addFeedback', () => {
    it('should add feedback and mark interview as completed', async () => {
      mockPrismaService.interview.findUnique.mockResolvedValue(mockInterview);
      mockPrismaService.interview.update.mockResolvedValue({
        ...mockInterview,
        feedback: 'Strong candidate.',
        status: InterviewStatus.COMPLETED,
      });

      const result = await service.addFeedback('uuid-interview-1', {
        feedback: 'Strong candidate.',
      });

      expect(result.feedback).toBe('Strong candidate.');
      expect(result.status).toBe(InterviewStatus.COMPLETED);
    });

    it('should throw NotFoundException when interview does not exist', async () => {
      mockPrismaService.interview.findUnique.mockResolvedValue(null);

      await expect(
        service.addFeedback('bad-id', { feedback: 'Good.' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
