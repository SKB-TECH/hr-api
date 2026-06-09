import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CandidateCertificationService } from './candidate-certificate.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCandidateCertificationDto } from './dto/create-candidate-certificate.dto';
import { Logger } from '@nestjs/common';

describe('CandidateCertificationService', () => {
  let service: CandidateCertificationService;
  let prisma: jest.Mocked<any>;

  const mockUserId = 'user-uuid-123';
  const mockCandidateProfileId = 'candidate-profile-uuid-456';
  const mockCertificationId = 'cert-uuid-789';

  const mockCandidateProfile = {
    id: mockCandidateProfileId,
    userId: mockUserId,
  };

  const mockCertificationData: any = {
    id: mockCertificationId,
    candidateId: mockCandidateProfileId,
    title: 'AWS Certified Solutions Architect – Associate',
    organization: 'Amazon Web Services (AWS)',
    issueDate: new Date('2025-05-15'),
    expirationDate: new Date('2028-05-15'),
    credentialId: 'AWS-ASA-12345',
    credentialUrl: 'https://www.credly.com/cert/12345',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    candidateProfile: {
      findUnique: jest.fn(),
    },
    candidateCertification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateCertificationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CandidateCertificationService>(CandidateCertificationService);
    prisma = module.get(PrismaService);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 1. ADD CERTIFICATION
  
  describe('add', () => {
    const dto: CreateCandidateCertificationDto = {
      title: 'AWS Certified Solutions Architect – Associate',
      organization: 'Amazon Web Services (AWS)',
      issueDate: '2025-05-15',
      expirationDate: '2028-05-15',
      credentialId: 'AWS-ASA-12345',
      credentialUrl: 'https://www.credly.com/cert/12345',
    };

    it('should create a certification successfully', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.create.mockResolvedValue(mockCertificationData);

      const result = await service.add(mockUserId, dto);

      expect(prisma.candidateProfile.findUnique).toHaveBeenCalledWith({ where: { userId: mockUserId } });
      expect(prisma.candidateCertification.create).toHaveBeenCalledWith({
        data: {
          candidateId: mockCandidateProfileId,
          title: dto.title,
          organization: dto.organization,
          issueDate: new Date(dto.issueDate),
          expirationDate: new Date(dto.expirationDate!),
          credentialId: dto.credentialId,
          credentialUrl: dto.credentialUrl,
        },
      });
      expect(result).toEqual(mockCertificationData);
    });

    it('should throw NotFoundException if candidate profile does not exist', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(null);

      await expect(service.add(mockUserId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if issue date is after expiration date', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      const invalidDto = { ...dto, issueDate: '2029-01-01', expirationDate: '2028-01-01' };

      await expect(service.add(mockUserId, invalidDto)).rejects.toThrow(BadRequestException);
    });
  });

  // 2. GET ALL SELF
  describe('getAllSelf', () => {
    it('should return all certifications belonging to the user', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.findMany.mockResolvedValue([mockCertificationData]);

      const result = await service.getAllSelf(mockUserId);

      expect(prisma.candidateCertification.findMany).toHaveBeenCalledWith({
        where: { candidateId: mockCandidateProfileId },
        orderBy: { issueDate: 'desc' },
      });
      expect(result).toEqual([mockCertificationData]);
    });
  });

  // 3. GET BY CANDIDATE ID (PUBLIC / BACK-OFFICE REVIEW)
  describe('getByCandidateId', () => {
    it('should return certifications matching the candidate profile identifier', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.findMany.mockResolvedValue([mockCertificationData]);

      const result = await service.getByCandidateId(mockCandidateProfileId);

      expect(prisma.candidateProfile.findUnique).toHaveBeenCalledWith({ where: { id: mockCandidateProfileId } });
      expect(prisma.candidateCertification.findMany).toHaveBeenCalledWith({
        where: { candidateId: mockCandidateProfileId },
        orderBy: { issueDate: 'desc' },
      });
      expect(result).toEqual([mockCertificationData]);
    });

    it('should throw NotFoundException if targeted profile id is missing', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(null);

      await expect(service.getByCandidateId(mockCandidateProfileId)).rejects.toThrow(NotFoundException);
    });
  });

  // 4. PATCH (UPDATE)
  describe('patch', () => {
    const patchDto: Partial<CreateCandidateCertificationDto> = { title: 'Updated Certification Title' };

    it('should update the certification successfully if requested by the owner', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.findUnique.mockResolvedValue(mockCertificationData);
      prisma.candidateCertification.update.mockResolvedValue({ ...mockCertificationData, title: patchDto.title });

      const result = await service.patch(mockUserId, mockCertificationId, patchDto);

      expect(prisma.candidateCertification.update).toHaveBeenCalledWith({
        where: { id: mockCertificationId },
        data: { title: patchDto.title },
      });
      expect(result.title).toEqual(patchDto.title);
    });

    it('should throw NotFoundException if certification record does not exist', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.findUnique.mockResolvedValue(null);

      await expect(service.patch(mockUserId, mockCertificationId, patchDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if candidate does not own the certification record', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.findUnique.mockResolvedValue({
        ...mockCertificationData,
        candidateId: 'different-candidate-uuid',
      });

      await expect(service.patch(mockUserId, mockCertificationId, patchDto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if update violates chronological date rules', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.findUnique.mockResolvedValue(mockCertificationData);

      const invalidDatesDto = { issueDate: '2030-01-01' }; // issueDate becomes greater than original expirationDate (2028)

      await expect(service.patch(mockUserId, mockCertificationId, invalidDatesDto)).rejects.toThrow(BadRequestException);
    });
  });

  // 5. REMOVE (DELETE)
  describe('remove', () => {
    it('should completely purge the record if parameters align correctly', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.findUnique.mockResolvedValue(mockCertificationData);
      prisma.candidateCertification.delete.mockResolvedValue(mockCertificationData);

      const result = await service.remove(mockUserId, mockCertificationId);

      expect(prisma.candidateCertification.delete).toHaveBeenCalledWith({ where: { id: mockCertificationId } });
      expect(result).toEqual({ success: true, message: 'Certification deleted successfully' });
    });

    it('should throw NotFoundException if target row is missing during deletion', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockUserId, mockCertificationId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-owner context intercepts request', async () => {
      prisma.candidateProfile.findUnique.mockResolvedValue(mockCandidateProfile);
      prisma.candidateCertification.findUnique.mockResolvedValue({
        ...mockCertificationData,
        candidateId: 'different-candidate-uuid',
      });

      await expect(service.remove(mockUserId, mockCertificationId)).rejects.toThrow(ForbiddenException);
    });
  });
});