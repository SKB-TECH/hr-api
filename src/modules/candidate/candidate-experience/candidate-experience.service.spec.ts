import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { CandidateExperienceService } from './candidate-experience.service';
import { CandidateExperienceRepository } from './candidate-experience.repository';
import { CandidateProfilesRepository } from '@/modules/candidate-profile/candidateProfiles.repository';
import { ExperienceNotFoundException } from './dto/experience-not-found.dto';

describe('CandidateExperienceService', () => {
  let service: CandidateExperienceService;
  let experienceRepoMock: jest.Mocked<any>;
  let profileRepoMock: jest.Mocked<any>;

  const mockUserId = 'user-uuid-123';
  const mockProfileId = 'profile-uuid-456';
  const mockExperienceId = 'experience-uuid-789';

  const mockProfile = {
    id: mockProfileId,
    userId: mockUserId,
    profileVisibility: 'public',
  };

  const mockUserWrapper = {
    id: mockUserId,
    candidateProfile: mockProfile,
  };

  const mockExperience = {
    id: mockExperienceId,
    candidateId: mockProfileId,
    companyName: 'Google',
    position: 'Backend Developer',
    employmentType: 'FULL_TIME',
    startDate: new Date('2023-01-15'),
    endDate: new Date('2025-06-30'),
    isCurrent: false,
    description: 'Built scalable REST APIs using NestJS and PostgreSQL.',
  };

  beforeEach(async () => {
    experienceRepoMock = {
      create: jest.fn(),
      findAllByCandidate: jest.fn(),
      findByIdAndCandidate: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findPublicByCandidate: jest.fn(),
    };

    profileRepoMock = {
      findProfileByUserId: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateExperienceService,
        { provide: CandidateExperienceRepository, useValue: experienceRepoMock },
        { provide: CandidateProfilesRepository, useValue: profileRepoMock },
      ],
    }).compile();

    service = module.get<CandidateExperienceService>(CandidateExperienceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. CREATE METHOD TESTS
  // ---------------------------------------------------------------------------
  describe('create', () => {
    const createDto = {
      companyName: 'Google',
      position: 'Backend Developer',
      employmentType: 'FULL_TIME' as const,
      startDate: '2023-01-15',
      endDate: '2025-06-30',
      isCurrent: false,
      description: 'Built scalable REST APIs.',
    };

    it('should successfully create an experience record', async () => {
      profileRepoMock.findProfileByUserId.mockResolvedValue(mockUserWrapper);
      experienceRepoMock.create.mockResolvedValue(mockExperience);

      const result = await service.create(mockUserId, createDto);

      expect(result).toEqual({
        success: true,
        message: 'Experience created successfully',
        data: mockExperience,
      });
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      const invalidDto = { ...createDto, startDate: '2025-01-01', endDate: '2023-01-01' };
      await expect(service.create(mockUserId, invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if job is current but contains an end date', async () => {
      const invalidDto = { ...createDto, isCurrent: true, endDate: '2025-06-30' };
      await expect(service.create(mockUserId, invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException if database operation fails', async () => {
      profileRepoMock.findProfileByUserId.mockResolvedValue(mockUserWrapper);
      experienceRepoMock.create.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. FIND ALL METHOD TESTS
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all experiences linked to candidate profile', async () => {
      profileRepoMock.findProfileByUserId.mockResolvedValue(mockUserWrapper);
      experienceRepoMock.findAllByCandidate.mockResolvedValue([mockExperience]);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual({ experiences: [mockExperience] });
    });
  });

  // ---------------------------------------------------------------------------
  // 3. FIND ONE METHOD TESTS
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should return a single experience if found and owned by user', async () => {
      profileRepoMock.findProfileByUserId.mockResolvedValue(mockUserWrapper);
      experienceRepoMock.findByIdAndCandidate.mockResolvedValue(mockExperience);

      const result = await service.findOne(mockExperienceId, mockUserId);

      expect(result).toEqual({ success: true, data: mockExperience });
    });
  });

  // ---------------------------------------------------------------------------
  // 4. UPDATE METHOD TESTS
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should successfully update experience with validated dates', async () => {
      profileRepoMock.findProfileByUserId.mockResolvedValue(mockUserWrapper);
      experienceRepoMock.findByIdAndCandidate.mockResolvedValue(mockExperience);
      experienceRepoMock.update.mockResolvedValue({ ...mockExperience, position: 'Senior' });

      const result = await service.update(mockExperienceId, mockUserId, { position: 'Senior' });

      expect(result.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. REMOVE METHOD TESTS
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should successfully delete experience item', async () => {
      profileRepoMock.findProfileByUserId.mockResolvedValue(mockUserWrapper);
      experienceRepoMock.findByIdAndCandidate.mockResolvedValue(mockExperience);
      experienceRepoMock.delete.mockResolvedValue(true);

      const result = await service.remove(mockExperienceId, mockUserId);

      expect(result).toEqual({ success: true, message: 'Experience deleted successfully' });
    });
  });

  // ---------------------------------------------------------------------------
  // 6. FIND PUBLIC EXPERIENCES METHOD TESTS
  // ---------------------------------------------------------------------------
  describe('findPublicExperiences', () => {
    it('should successfully fetch using a direct Profile ID strategy', async () => {
      profileRepoMock.findById.mockResolvedValue(mockProfile);
      experienceRepoMock.findPublicByCandidate.mockResolvedValue([mockExperience]);

      const result = await service.findPublicExperiences(mockProfileId);

      expect(result.experience).toBeDefined();
      expect(Array.isArray(result.experience)).toBe(true);
      expect(result.experience[0].companyName).toBe('Google');
    });

    it('should fallback to User ID lookup if Profile ID strategy misses', async () => {
      profileRepoMock.findById.mockResolvedValue(null);
      profileRepoMock.findProfileByUserId.mockResolvedValue(mockUserWrapper);
      experienceRepoMock.findPublicByCandidate.mockResolvedValue([mockExperience]);

      const result = await service.findPublicExperiences(mockUserId);

      expect(result.experience).toBeDefined();
      expect(result.experience[0].companyName).toBe('Google');
    });

    it('should throw ExperienceNotFoundException if neither ID resolves a profile', async () => {
      profileRepoMock.findById.mockResolvedValue(null);
      profileRepoMock.findProfileByUserId.mockResolvedValue(null);

      await expect(service.findPublicExperiences('fake-id')).rejects.toThrow(ExperienceNotFoundException);
    });

    it('should throw ForbiddenException if profile visibility is set to private', async () => {
      const privateProfile = { ...mockProfile, profileVisibility: 'private' };
      profileRepoMock.findById.mockResolvedValue(privateProfile);

      await expect(service.findPublicExperiences(mockProfileId)).rejects.toThrow(ForbiddenException);
    });
  });
});