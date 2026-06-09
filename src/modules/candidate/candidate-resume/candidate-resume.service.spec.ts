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

  // Defined and perfectly formatted UUIDs for testing so as to bypass any strict validation
  const mockResumeId = '550e8400-e29b-41d4-a716-446655440000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockCandidateId = '987fcdeb-51a2-43f7-9012-345678901234';

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
      const uploadResult = { secure_url: 'url', public_id: 'pid' };

      (repository.getCandidateProfileId as jest.Mock).mockResolvedValue(mockCandidateId);
      (cloudinary.uploadFile as jest.Mock).mockResolvedValue(uploadResult);
      (mockPrisma.resume.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.resume.create as jest.Mock).mockResolvedValue({ 
        id: mockResumeId, 
        candidateId: mockCandidateId, 
        title: 'CV', 
        isDefault: true, 
        createdAt: new Date() 
      });

      // Used the valid UUIDs here
      const result = await service.uploadResume(mockFile, mockUserId, 'CV');

      expect(result.id).toBe(mockResumeId);
      expect(mockPrisma.resume.create).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if cloudinary fails', async () => {
      (repository.getCandidateProfileId as jest.Mock).mockResolvedValue(mockCandidateId);
      (cloudinary.uploadFile as jest.Mock).mockRejectedValue(new Error('Cloudinary error'));

      // Passes the valid mockUserId instead of 'u1'
      await expect(service.uploadResume({} as any, mockUserId, 't1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteResume', () => {
    it('should delete resume and call cloudinary delete', async () => {
      // Replaces 'r1' and 'c1' with valid UUIDs
      const resume = { id: mockResumeId, candidateId: mockCandidateId, publicId: 'p1', isDefault: false };
      (mockPrisma.resume.findUnique as jest.Mock).mockResolvedValue(resume);
      (repository.getCandidateProfileId as jest.Mock).mockResolvedValue(mockCandidateId);
      
      // Triggers the delete function with the perfectly formatted UUIDs
      await service.deleteResume(mockResumeId, mockUserId);

      expect(cloudinary.deleteFile).toHaveBeenCalledWith('p1', true);
      // Ensures the test checks against the correct UUID
      expect(mockPrisma.resume.delete).toHaveBeenCalledWith({ where: { id: mockResumeId } });
    });
  });
});