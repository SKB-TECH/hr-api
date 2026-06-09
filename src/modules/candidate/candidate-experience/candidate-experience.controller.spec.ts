import { Test, TestingModule } from '@nestjs/testing';
import { CandidateExperienceController } from './candidate-experience.controller';
import { CandidateExperienceService } from './candidate-experience.service';
import { CreateCandidateExperienceDto } from './dto/create-candidate-experience.dto';
import { CandidateExperienceRepository } from './candidate-experience.repository';
import { CandidateProfilesRepository } from '@/modules/candidate-profile/candidateProfiles.repository';

describe('CandidateExperienceController', () => {
  let controller: CandidateExperienceController;
  let service: jest.Mocked<any>;

  const mockUserId = 'user-uuid-123';
  const mockProfileId = 'profile-uuid-456';
  const mockExperienceId = 'experience-uuid-789';

  const mockRequest = {
    user: {
      id: mockUserId,
    },
  };

  // Typings casted to any to safely skip missing Prisma metadata properties
  const mockExperienceData: any = {
    id: mockExperienceId,
    candidateId: mockProfileId,
    companyName: 'Google',
    position: 'Backend Developer',
    employmentType: 'FULL_TIME',
    startDate: new Date('2023-01-15'),
    endDate: new Date('2025-06-30'),
    isCurrent: false,
    description: 'Built scalable REST APIs using NestJS and PostgreSQL.',
    countryName: 'Rwanda',
    cityName: 'Kigali',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCandidateExperienceService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findPublicExperiences: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateExperienceController],
      providers: [
        {
          provide: CandidateExperienceService,
          useValue: mockCandidateExperienceService,
        },
        {
          provide: CandidateExperienceRepository,
          useValue: {},
        },
        {
          provide: CandidateProfilesRepository,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CandidateExperienceController>(CandidateExperienceController);
    service = module.get(CandidateExperienceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // 1. POST /candidate-experience
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('should invoke service.create with request user id and payload', async () => {
      const dto: CreateCandidateExperienceDto = {
        companyName: 'Google',
        position: 'Backend Developer',
        employmentType: 'FULL_TIME',
        startDate: '2023-01-15',
        endDate: '2025-06-30',
        isCurrent: false,
        description: 'Built scalable REST APIs.',
      };

      const expectedResponse: any = { success: true, message: 'Experience created successfully', data: mockExperienceData };
      service.create.mockResolvedValue(expectedResponse);

      const result = await controller.create(mockRequest, dto);

      expect(result).toEqual(expectedResponse);
      expect(service.create).toHaveBeenCalledWith(mockUserId, dto);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. GET /candidate-experience
  // ---------------------------------------------------------------------------
  describe('findAll', () => {
    it('should invoke service.findAll with request user id', async () => {
      const expectedResponse: any = { experiences: [mockExperienceData] };
      service.findAll.mockResolvedValue(expectedResponse);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(service.findAll).toHaveBeenCalledWith(mockUserId);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. GET /candidate-experience/public/:candidateId
  // ---------------------------------------------------------------------------
  describe('findPublicExperiences', () => {
    it('should invoke service.findPublicExperiences with provided tracking parameter string', async () => {
      const targetParamId = 'any-valid-uuid-or-id';
      const expectedResponse: any = { experience: [mockExperienceData] };
      service.findPublicExperiences.mockResolvedValue(expectedResponse);

      const result = await controller.findPublicExperiences(targetParamId);

      expect(result).toEqual(expectedResponse);
      expect(service.findPublicExperiences).toHaveBeenCalledWith(targetParamId);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. GET /candidate-experience/:id
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    it('should invoke service.findOne with route experience id and request user id', async () => {
      const expectedResponse: any = { success: true, data: mockExperienceData };
      service.findOne.mockResolvedValue(expectedResponse);

      const result = await controller.findOne(mockExperienceId, mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(service.findOne).toHaveBeenCalledWith(mockExperienceId, mockUserId);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. PATCH /candidate-experience/:id
  // ---------------------------------------------------------------------------
  describe('update', () => {
    it('should invoke service.update with target id, request user id, and payload object data', async () => {
      const updateDto: Partial<CreateCandidateExperienceDto> = { position: 'Senior Backend Engineer' };
      const expectedResponse: any = { success: true, message: 'Experience updated successfully', data: mockExperienceData };
      service.update.mockResolvedValue(expectedResponse);

      const result = await controller.update(mockExperienceId, mockRequest, updateDto);

      expect(result).toEqual(expectedResponse);
      expect(service.update).toHaveBeenCalledWith(mockExperienceId, mockUserId, updateDto);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. DELETE /candidate-experience/:id
  // ---------------------------------------------------------------------------
  describe('remove', () => {
    it('should invoke service.remove with target id and request user id', async () => {
      const expectedResponse: any = { success: true, message: 'Experience deleted successfully' };
      service.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(mockExperienceId, mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(service.remove).toHaveBeenCalledWith(mockExperienceId, mockUserId);
    });
  });
});