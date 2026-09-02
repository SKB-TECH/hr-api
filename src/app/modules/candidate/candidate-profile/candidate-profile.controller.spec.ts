import { Test, TestingModule } from '@nestjs/testing';
import { CandidateProfilesController } from './candidate-profile.controller';
import { CandidateProfilesService } from './candidate-profile.service';
import { UserCandidateDto } from './dto/user-candidate.dto';
import { UserRole } from '../../../../utils/enums';

describe('CandidateProfilesController', () => {
  let controller: CandidateProfilesController;

  const mockService = {
    getCandidateProfile: jest.fn(),
    updateCandidateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateProfilesController],
      providers: [
        {
          provide: CandidateProfilesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CandidateProfilesController>(
      CandidateProfilesController,
    );

    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@mail.com',
        password: 'hashed',
      };

      mockService.getCandidateProfile.mockResolvedValue(mockUser);

      const req = {
        user: { id: '1', role: UserRole.CANDIDATE },
      };

      const result = await controller.getProfile(req);

      expect(result.data).toBeInstanceOf(UserCandidateDto);
      expect(mockService.getCandidateProfile).toHaveBeenCalledWith('1');
    });

    it('should call service with correct userId', async () => {
      mockService.getCandidateProfile.mockResolvedValue({});

      await controller.getProfile({
        user: { id: 'abc' },
      });

      expect(mockService.getCandidateProfile).toHaveBeenCalledWith('abc');
    });

    it('returns the phone number stored on the candidate profile', async () => {
      mockService.getCandidateProfile.mockResolvedValue({
        id: 'user-id',
        phoneNumber: '+243812345678',
        candidateProfile: {
          id: 'candidate-id',
          phoneNumber: '+243812345678',
        },
      });

      const result = await controller.getProfile({ user: { id: 'user-id' } });

      expect(result.data.phoneNumber).toBe('+243812345678');
      expect(result.data.candidateProfile.phoneNumber).toBe('+243812345678');
    });
  });
});
