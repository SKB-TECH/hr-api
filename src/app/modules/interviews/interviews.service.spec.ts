import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InterviewStatus } from '../../../utils/enums';
import { InterviewsService } from './interviews.service';
import { Interview } from './entities/interview.entity';
import { Application } from '../applications/entities/application.entity';

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

const mockInterviewRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const mockApplicationRepo = {
  findOne: jest.fn(),
};

describe('InterviewsService', () => {
  let service: InterviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterviewsService,
        { provide: getRepositoryToken(Interview), useValue: mockInterviewRepo },
        {
          provide: getRepositoryToken(Application),
          useValue: mockApplicationRepo,
        },
      ],
    }).compile();

    service = module.get<InterviewsService>(InterviewsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: any = {
      applicationId: 'uuid-app-1',
      companyId: 'uuid-company-1',
      title: 'Written Test',
      scheduledAt: '2026-07-10T10:00:00.000Z',
      endTime: '2026-07-10T11:00:00.000Z',
    };

    it('should schedule an interview', async () => {
      mockApplicationRepo.findOne.mockResolvedValue({ id: 'uuid-app-1' });
      mockInterviewRepo.create.mockReturnValue(mockInterview);
      mockInterviewRepo.save.mockResolvedValue(mockInterview);

      const result = await service.create(dto);

      expect(result.id).toBe('uuid-interview-1');
      expect(result.title).toBe('Written Test');
      expect(mockInterviewRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when application does not exist', async () => {
      mockApplicationRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByApplication', () => {
    it('should return interviews ordered by scheduledAt asc', async () => {
      mockInterviewRepo.find.mockResolvedValue([mockInterview]);

      const result = await service.findByApplication('uuid-app-1');

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Written Test');
      expect(mockInterviewRepo.find).toHaveBeenCalledWith({
        where: { applicationId: 'uuid-app-1' },
        order: { scheduledAt: 'ASC' },
      });
    });

    it('should return empty array when no interviews scheduled', async () => {
      mockInterviewRepo.find.mockResolvedValue([]);

      const result = await service.findByApplication('uuid-app-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByCompany', () => {
    it('should return all interviews for company calendar', async () => {
      mockInterviewRepo.find.mockResolvedValue([mockInterview]);

      const result = await service.findByCompany('uuid-company-1');

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no interviews exist', async () => {
      mockInterviewRepo.find.mockResolvedValue([]);

      const result = await service.findByCompany('uuid-company-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('addFeedback', () => {
    it('should add feedback and mark interview as completed', async () => {
      mockInterviewRepo.findOne
        .mockResolvedValueOnce(mockInterview)
        .mockResolvedValueOnce({
          ...mockInterview,
          feedback: 'Strong candidate.',
          status: InterviewStatus.COMPLETED,
        });
      mockInterviewRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.addFeedback('uuid-interview-1', {
        feedback: 'Strong candidate.',
      });

      expect(result!.feedback).toBe('Strong candidate.');
      expect(result!.status).toBe(InterviewStatus.COMPLETED);
      expect(mockInterviewRepo.update).toHaveBeenCalledWith(
        'uuid-interview-1',
        {
          feedback: 'Strong candidate.',
          status: InterviewStatus.COMPLETED,
        },
      );
    });

    it('should throw NotFoundException when interview does not exist', async () => {
      mockInterviewRepo.findOne.mockResolvedValue(null);

      await expect(
        service.addFeedback('bad-id', { feedback: 'Good.' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
