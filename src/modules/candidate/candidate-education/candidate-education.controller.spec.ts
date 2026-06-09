import { Test, TestingModule } from '@nestjs/testing';
import { CandidateEducationController } from './candidate-education.controller';
import { CandidateEducationService } from './candidate-education.service';

describe('CandidateEducationController', () => {
  let controller: CandidateEducationController;

  const mockService = {
    add: jest.fn(),
    getAll: jest.fn(),
    getByCandidateId: jest.fn(),
    patch: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = {
    user: {
      id: 'user-uuid-1',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateEducationController],
      providers: [
        {
          provide: CandidateEducationService,
          useValue: mockService, // ✅ MOCK SERVICE
        },
      ],
    }).compile();

    controller = module.get<CandidateEducationController>(
      CandidateEducationController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------
  // CREATE
  // -----------------------
  it('should create education', async () => {
    const dto = { schoolName: 'Test School' };
    const result = { id: 'edu-1' };

    mockService.add.mockResolvedValue(result);

    expect(await controller.create(mockReq, dto as any)).toEqual(result);
    expect(mockService.add).toHaveBeenCalledWith('user-uuid-1', dto);
  });

  // -----------------------
  // GET ALL (auth user)
  // -----------------------
  it('should return all education for user', async () => {
    const result = [{ id: 'edu-1' }];

    mockService.getAll.mockResolvedValue(result);

    expect(await controller.findAll(mockReq)).toEqual(result);
    expect(mockService.getAll).toHaveBeenCalledWith('user-uuid-1');
  });

  // -----------------------
  // GET BY CANDIDATE ID
  // -----------------------
  it('should return candidate education by candidateId', async () => {
    const result = [{ id: 'edu-1' }];

    mockService.getByCandidateId.mockResolvedValue(result);

    expect(await controller.findCandidateEducation('candidate-1')).toEqual(result);
    expect(mockService.getByCandidateId).toHaveBeenCalledWith('candidate-1');
  });

  // -----------------------
  // UPDATE
  // -----------------------
  it('should update education', async () => {
    const dto = { schoolName: 'Updated School' };
    const result = { id: 'edu-1', schoolName: 'Updated School' };

    mockService.patch.mockResolvedValue(result);

    expect(
      await controller.update(mockReq, 'edu-1', dto as any),
    ).toEqual(result);

    expect(mockService.patch).toHaveBeenCalledWith(
      'user-uuid-1',
      'edu-1',
      dto,
    );
  });

  // -----------------------
  // DELETE
  // -----------------------
  it('should delete education', async () => {
    const result = { deleted: true };

    mockService.remove.mockResolvedValue(result);

    expect(await controller.remove(mockReq, 'edu-1')).toEqual(result);

    expect(mockService.remove).toHaveBeenCalledWith(
      'user-uuid-1',
      'edu-1',
    );
  });
});