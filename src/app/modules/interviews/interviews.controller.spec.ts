import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InterviewStatus } from '../../../utils/enums';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

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
};

const mockInterviewsService = {
  create: jest.fn(),
  findByApplication: jest.fn(),
  findByCompany: jest.fn(),
  addFeedback: jest.fn(),
};

describe('InterviewsController', () => {
  let controller: InterviewsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InterviewsController],
      providers: [
        { provide: InterviewsService, useValue: mockInterviewsService },
      ],
    }).compile();

    controller = module.get<InterviewsController>(InterviewsController);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should schedule an interview', async () => {
      mockInterviewsService.create.mockResolvedValue(mockInterview);

      const dto = {
        applicationId: 'uuid-app-1',
        companyId: 'uuid-company-1',
        title: 'Written Test',
        scheduledAt: '2026-07-10T10:00:00.000Z',
        endTime: '2026-07-10T11:00:00.000Z',
      };

      const result = await controller.create(dto as any);

      expect(result.statusCode).toBe(201);
      expect(result.data.id).toBe('uuid-interview-1');
      expect(mockInterviewsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findByApplication', () => {
    it('should return interview list for an applicant', async () => {
      mockInterviewsService.findByApplication.mockResolvedValue([
        mockInterview,
      ]);

      const result = await controller.findByApplication('uuid-app-1');

      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(mockInterviewsService.findByApplication).toHaveBeenCalledWith(
        'uuid-app-1',
      );
    });
  });

  describe('findByCompany', () => {
    it('should return company interview schedule', async () => {
      mockInterviewsService.findByCompany.mockResolvedValue([mockInterview]);

      const result = await controller.findByCompany('uuid-company-1');

      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(mockInterviewsService.findByCompany).toHaveBeenCalledWith(
        'uuid-company-1',
      );
    });
  });

  describe('addFeedback', () => {
    it('should add feedback to an interview', async () => {
      mockInterviewsService.addFeedback.mockResolvedValue({
        ...mockInterview,
        feedback: 'Strong candidate.',
        status: InterviewStatus.COMPLETED,
      });

      const result = await controller.addFeedback('uuid-interview-1', {
        feedback: 'Strong candidate.',
      });

      expect(result.statusCode).toBe(200);
      expect(result.data.feedback).toBe('Strong candidate.');
      expect(result.data.status).toBe(InterviewStatus.COMPLETED);
    });

    it('should propagate NotFoundException from service', async () => {
      mockInterviewsService.addFeedback.mockRejectedValue(
        new NotFoundException('Interview not found'),
      );

      await expect(
        controller.addFeedback('bad-id', { feedback: 'Good.' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
