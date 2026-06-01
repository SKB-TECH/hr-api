import { Test, TestingModule } from '@nestjs/testing';
import { CandidateResumeService } from './candidate-resume.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';
import { CandidateProfilesRepository } from './candidate-resume.repository';
import { InternalServerErrorException } from '@nestjs/common';

describe('CandidateResumeService', () => {
  let service: CandidateResumeService;
  let prisma: PrismaService;
  let cloudinary: CloudinaryService;
  let repository: CandidateProfilesRepository;

  const mockPrisma = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    resume: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCloudinary = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockRepo = {
    getCandidateProfileId: jest.fn(),
  };
  

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateResumeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CloudinaryService, useValue: mockCloudinary },
        { provide: CandidateProfilesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CandidateResumeService>(CandidateResumeService);
    prisma = module.get<PrismaService>(PrismaService);
    cloudinary = module.get<CloudinaryService>(CloudinaryService);
    repository = module.get<CandidateProfilesRepository>(CandidateProfilesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadResume', () => {
    it('should successfully upload a resume and create a record', async () => {
      const mockFile = { buffer: Buffer.from('test') };
      const userId = 'user-123';
      const candidateId = 'cand-123';
      const uploadResult = { secure_url: 'url', public_id: 'pid' };

      (repository.getCandidateProfileId as jest.Mock).mockResolvedValue(candidateId);
      (cloudinary.uploadFile as jest.Mock).mockResolvedValue(uploadResult);
      (mockPrisma.resume.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.resume.create as jest.Mock).mockResolvedValue({ 
        id: 'res-1', 
        candidateId, 
        title: 'CV', 
        isDefault: true, 
        createdAt: new Date() 
      });

      const result = await service.uploadResume(mockFile, userId, 'CV');

      expect(result.id).toBe('res-1');
      expect(mockPrisma.resume.create).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if cloudinary fails', async () => {
      (repository.getCandidateProfileId as jest.Mock).mockResolvedValue('cand-123');
      (cloudinary.uploadFile as jest.Mock).mockRejectedValue(new Error('Cloudinary error'));

      await expect(service.uploadResume({} as any, 'u1', 't1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteResume', () => {
    it('should delete resume and call cloudinary delete', async () => {
      const resume = { id: 'r1', candidateId: 'c1', publicId: 'p1', isDefault: false };
      (mockPrisma.resume.findUnique as jest.Mock).mockResolvedValue(resume);
      (repository.getCandidateProfileId as jest.Mock).mockResolvedValue('c1');
      
      await service.deleteResume('r1', 'u1');

      expect(cloudinary.deleteFile).toHaveBeenCalledWith('p1', true);
      expect(mockPrisma.resume.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });
  });
});