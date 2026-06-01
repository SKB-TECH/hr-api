import { Test, TestingModule } from '@nestjs/testing';
import { CandidateProfilesController } from './candidate-profile.controller';
import { CandidateProfilesService } from './candidate-profile.service';
import { UserCandidateEntity } from './entities/candidate-profile.entity';
import { UserRole } from '@prisma/client';

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

  
   //GET profile_info
  
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

      expect(result).toBeInstanceOf(UserCandidateEntity);
      expect(mockService.getCandidateProfile).toHaveBeenCalledWith('1');
    });

    it('should call service with correct userId', async () => {
      mockService.getCandidateProfile.mockResolvedValue({});

      await controller.getProfile({
        user: { id: 'abc' },
      });

      expect(mockService.getCandidateProfile).toHaveBeenCalledWith('abc');
    });
  });

});