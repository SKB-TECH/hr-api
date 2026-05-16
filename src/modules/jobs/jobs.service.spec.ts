import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsRepository } from './repositories/jobs.repository';

const mockJob = {
  id: 'uuid-job-1',
  title: 'Frontend Developer',
  location: 'Manchester, UK',
  salaryMin: 45000,
  salaryMax: 65000,
  salaryExtras: 'Bonus + Pension + Benefits',
  jobType: 'Hybrid, Permanent',
  reference: '#ITEM#2038-234',
  description: 'UK Leading Ecommerce Firm...',
  bannerUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockApplication = {
  id: 'uuid-app-1',
  jobId: 'uuid-job-1',
  fullName: 'John Smith',
  email: 'john@example.com',
  contactNumber: '+250788123456',
  coverLetter: 'I am very interested in this role.',
  createdAt: new Date(),
};

const mockJobsRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  saveApplication: jest.fn(),
};

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: JobsRepository, useValue: mockJobsRepository },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jest.clearAllMocks();
  });

  // ── JOBS ────────────────────────────────────────────────────────────────

  describe('getAll', () => {
    it('should return array of jobs', async () => {
      mockJobsRepository.findAll.mockResolvedValue([mockJob]);
      const result = await service.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Frontend Developer');
    });

    it('should return empty array when no jobs exist', async () => {
      mockJobsRepository.findAll.mockResolvedValue([]);
      const result = await service.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should return job when it exists', async () => {
      mockJobsRepository.findById.mockResolvedValue(mockJob);
      const result = await service.getById('uuid-job-1');
      expect(result).toEqual(mockJob);
      expect(mockJobsRepository.findById).toHaveBeenCalledWith('uuid-job-1');
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockJobsRepository.findById.mockRejectedValue(new NotFoundException());
      await expect(service.getById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createJob', () => {
    it('should create and return a job', async () => {
      const dto = {
        title: 'Frontend Developer',
        location: 'Manchester, UK',
        salaryMin: 45000,
        salaryMax: 65000,
        salaryExtras: 'Bonus + Pension + Benefits',
        jobType: 'Hybrid, Permanent',
        reference: '#ITEM#2038-234',
        description: 'UK Leading Ecommerce Firm...',
      };
      mockJobsRepository.create.mockResolvedValue(mockJob);
      const result = await service.createJob(dto);
      expect(result).toEqual(mockJob);
      expect(mockJobsRepository.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateJob', () => {
    it('should update and return the job', async () => {
      const dto = { salaryMin: 50000, salaryMax: 70000 };
      mockJobsRepository.update.mockResolvedValue({ ...mockJob, ...dto });
      const result = await service.updateJob('uuid-job-1', dto);
      expect(result.salaryMin).toBe(50000);
      expect(mockJobsRepository.update).toHaveBeenCalledWith('uuid-job-1', dto);
    });
  });

  describe('deleteJob', () => {
    it('should call delete with correct id', async () => {
      mockJobsRepository.delete.mockResolvedValue(undefined);
      await service.deleteJob('uuid-job-1');
      expect(mockJobsRepository.delete).toHaveBeenCalledWith('uuid-job-1');
    });
  });

  // ── APPLICATIONS ────────────────────────────────────────────────────────

  describe('applyForJob', () => {
    it('should save and return application when job exists', async () => {
      const dto = {
        fullName: 'John Smith',
        email: 'john@example.com',
        contactNumber: '+250788123456',
        coverLetter: 'I am very interested in this role.',
      };
      mockJobsRepository.findById.mockResolvedValue(mockJob);
      mockJobsRepository.saveApplication.mockResolvedValue(mockApplication);
      const result = await service.applyForJob('uuid-job-1', dto);
      expect(result).toEqual(mockApplication);
      expect(mockJobsRepository.findById).toHaveBeenCalledWith('uuid-job-1');
      expect(mockJobsRepository.saveApplication).toHaveBeenCalledWith({ ...dto, jobId: 'uuid-job-1' });
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockJobsRepository.findById.mockRejectedValue(new NotFoundException());
      await expect(service.applyForJob('bad-id', {} as any)).rejects.toThrow(NotFoundException);
    });
  });
});
