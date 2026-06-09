import { Test, TestingModule } from '@nestjs/testing';
import { CandidateCertificationController } from './candidate-certificate.controller';
import { CandidateCertificationService } from './candidate-certificate.service';
import { CreateCandidateCertificationDto } from './dto/create-candidate-certificate.dto';

describe('CandidateCertificationController', () => {
  let controller: CandidateCertificationController;
  let service: jest.Mocked<any>;

  const mockUserId = 'user-uuid-123';
  const mockCandidateProfileId = 'candidate-profile-uuid-456';
  const mockCertificationId = 'cert-uuid-789';

  const mockRequest = {
    user: {
      id: mockUserId,
    },
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

  const mockCandidateCertificationService = {
    add: jest.fn(),
    getByCandidateId: jest.fn(),
    getAllSelf: jest.fn(),
    patch: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateCertificationController],
      providers: [
        {
          provide: CandidateCertificationService,
          useValue: mockCandidateCertificationService,
        },
      ],
    }).compile();

    controller = module.get<CandidateCertificationController>(CandidateCertificationController);
    service = module.get(CandidateCertificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // 1. POST /candidate-certifications (CREATE)
  describe('create', () => {
    it('should invoke service.add with request user id and dto payload', async () => {
      const dto: CreateCandidateCertificationDto = {
        title: 'AWS Certified Solutions Architect – Associate',
        organization: 'Amazon Web Services (AWS)',
        issueDate: '2025-05-15',
        expirationDate: '2028-05-15',
        credentialId: 'AWS-ASA-12345',
        credentialUrl: 'https://www.credly.com/cert/12345',
      };

      service.add.mockResolvedValue(mockCertificationData);

      const result = await controller.create(mockRequest, dto);

      expect(result).toEqual(mockCertificationData);
      expect(service.add).toHaveBeenCalledWith(mockUserId, dto);
    });
  });

  // 2. GET /candidate-certifications/candidates/:candidateId (PUBLIC / BACK-OFFICE ACCESS)
  describe('findCandidateCertifications', () => {
    it('should invoke service.getByCandidateId with the candidateId route parameter', async () => {
      const expectedResponse: any = [mockCertificationData];
      service.getByCandidateId.mockResolvedValue(expectedResponse);

      const result = await controller.findCandidateCertifications(mockCandidateProfileId);

      expect(result).toEqual(expectedResponse);
      expect(service.getByCandidateId).toHaveBeenCalledWith(mockCandidateProfileId);
    });
  });

  // 3. GET /candidate-certifications (FIND ALL SELF LOOKUP)
  describe('findAllSelf', () => {
    it('should invoke service.getAllSelf with request user id', async () => {
      const expectedResponse: any = [mockCertificationData];
      service.getAllSelf.mockResolvedValue(expectedResponse);

      const result = await controller.findAllSelf(mockRequest);

      expect(result).toEqual(expectedResponse);
      expect(service.getAllSelf).toHaveBeenCalledWith(mockUserId);
    });
  });

  // 4. PATCH /candidate-certifications/:id (UPDATE)
  describe('update', () => {
    it('should invoke service.patch with request user id, record id parameter, and payload', async () => {
      const updateDto: Partial<CreateCandidateCertificationDto> = { title: 'Updated Certificate Title' };
      const expectedResponse: any = { ...mockCertificationData, title: 'Updated Certificate Title' };
      service.patch.mockResolvedValue(expectedResponse);

      const result = await controller.update(mockRequest, mockCertificationId, updateDto);

      expect(result).toEqual(expectedResponse);
      expect(service.patch).toHaveBeenCalledWith(mockUserId, mockCertificationId, updateDto);
    });
  });

  // 5. DELETE /candidate-certifications/:id (DELETE)
  describe('remove', () => {
    it('should invoke service.remove with request user id and target row parameter id', async () => {
      const expectedResponse = { success: true, message: 'Certification deleted successfully' };
      service.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(mockRequest, mockCertificationId);

      expect(result).toEqual(expectedResponse);
      expect(service.remove).toHaveBeenCalledWith(mockUserId, mockCertificationId);
    });
  });
});