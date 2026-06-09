import { Test, TestingModule } from '@nestjs/testing';
import { CandidateProfilesService } from './candidate-profile.service';
import { CandidateProfilesRepository } from './candidateProfiles.repository';
import { CloudinaryService } from '../../infrastructure/cloudinary/cloudinary.service';
import { NotFoundException } from '@nestjs/common';

describe('CandidateProfilesService', () => {
  let service: CandidateProfilesService;

  const mockRepository = {
    findProfileByUserId: jest.fn(),
    findUserByEmail: jest.fn(),
    updateCandidateProfile: jest.fn(),
    updateUserAccount: jest.fn(),
  };

  const mockCloudinaryService = {
    replaceFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateProfilesService,
        {
          provide: CandidateProfilesRepository,
          useValue: mockRepository,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
      ],
    }).compile();

    service = module.get<CandidateProfilesService>(
      CandidateProfilesService,
    );

    jest.clearAllMocks();
  });

  /**
   * =========================
   * GET PROFILE
   * =========================
   */
  describe('getCandidateProfile', () => {
    it('should return sanitized user profile', async () => {
      mockRepository.findProfileByUserId.mockResolvedValue({
        id: '1',
        email: 'test@mail.com',
        password: 'hashedPassword',
      });

      const result = await service.getCandidateProfile('1');

      expect(result).toEqual({
        id: '1',
        email: 'test@mail.com',
      });

      expect(mockRepository.findProfileByUserId).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findProfileByUserId.mockResolvedValue(null);

      await expect(
        service.getCandidateProfile('1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});