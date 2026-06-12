import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CandidateCertificationService } from './candidate-certificate.service';
import { CandidateCertification } from './entities/candidate-certification.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';
import { CreateCandidateCertificationDto } from './dto/create-candidate-certificate.dto';

describe('CandidateCertificationService', () => {
  let service: CandidateCertificationService;

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

  const mockCertificationRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    delete: jest.fn(),
  };

  const mockCandidateProfileRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateCertificationService,
        {
          provide: getRepositoryToken(CandidateCertification),
          useValue: mockCertificationRepo,
        },
        {
          provide: getRepositoryToken(CandidateProfile),
          useValue: mockCandidateProfileRepo,
        },
      ],
    }).compile();

    service = module.get<CandidateCertificationService>(
      CandidateCertificationService,
    );
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

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
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.create.mockReturnValue(mockCertificationData);
      mockCertificationRepo.save.mockResolvedValue(mockCertificationData);

      const result = await service.add(mockUserId, dto);

      expect(mockCandidateProfileRepo.findOne).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(mockCertificationRepo.create).toHaveBeenCalled();
      expect(mockCertificationRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockCertificationData);
    });

    it('should throw NotFoundException if candidate profile does not exist', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(null);

      await expect(service.add(mockUserId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if issue date is after expiration date', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      const invalidDto = {
        ...dto,
        issueDate: '2029-01-01',
        expirationDate: '2028-01-01',
      };

      await expect(service.add(mockUserId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getAllSelf', () => {
    it('should return all certifications belonging to the user', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.find.mockResolvedValue([mockCertificationData]);

      const result = await service.getAllSelf(mockUserId);

      expect(mockCertificationRepo.find).toHaveBeenCalledWith({
        where: { candidateId: mockCandidateProfileId },
        order: { issueDate: 'DESC' },
      });
      expect(result).toEqual([mockCertificationData]);
    });
  });

  describe('getByCandidateId', () => {
    it('should return certifications matching the candidate profile identifier', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.find.mockResolvedValue([mockCertificationData]);

      const result = await service.getByCandidateId(mockCandidateProfileId);

      expect(mockCandidateProfileRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockCandidateProfileId },
      });
      expect(mockCertificationRepo.find).toHaveBeenCalledWith({
        where: { candidateId: mockCandidateProfileId },
        order: { issueDate: 'DESC' },
      });
      expect(result).toEqual([mockCertificationData]);
    });

    it('should throw NotFoundException if targeted profile id is missing', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getByCandidateId(mockCandidateProfileId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('patch', () => {
    const patchDto: Partial<CreateCandidateCertificationDto> = {
      title: 'Updated Certification Title',
    };

    it('should update the certification successfully if requested by the owner', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.findOne.mockResolvedValue({
        ...mockCertificationData,
      });
      mockCertificationRepo.merge.mockImplementation((entity, patch) =>
        Object.assign(entity, patch),
      );
      mockCertificationRepo.save.mockResolvedValue({
        ...mockCertificationData,
        title: patchDto.title,
      });

      const result = await service.patch(
        mockUserId,
        mockCertificationId,
        patchDto,
      );

      expect(mockCertificationRepo.merge).toHaveBeenCalled();
      expect(mockCertificationRepo.save).toHaveBeenCalled();
      expect(result.title).toEqual(patchDto.title);
    });

    it('should throw NotFoundException if certification record does not exist', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.patch(mockUserId, mockCertificationId, patchDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if candidate does not own the certification record', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.findOne.mockResolvedValue({
        ...mockCertificationData,
        candidateId: 'different-candidate-uuid',
      });

      await expect(
        service.patch(mockUserId, mockCertificationId, patchDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if update violates chronological date rules', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.findOne.mockResolvedValue(mockCertificationData);

      const invalidDatesDto = { issueDate: '2030-01-01' };

      await expect(
        service.patch(mockUserId, mockCertificationId, invalidDatesDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should completely purge the record if parameters align correctly', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.findOne.mockResolvedValue(mockCertificationData);
      mockCertificationRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(mockUserId, mockCertificationId);

      expect(mockCertificationRepo.delete).toHaveBeenCalledWith(
        mockCertificationId,
      );
      expect(result).toEqual({
        success: true,
        message: 'Certification deleted successfully',
      });
    });

    it('should throw NotFoundException if target row is missing during deletion', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.remove(mockUserId, mockCertificationId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-owner context intercepts request', async () => {
      mockCandidateProfileRepo.findOne.mockResolvedValue(mockCandidateProfile);
      mockCertificationRepo.findOne.mockResolvedValue({
        ...mockCertificationData,
        candidateId: 'different-candidate-uuid',
      });

      await expect(
        service.remove(mockUserId, mockCertificationId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
