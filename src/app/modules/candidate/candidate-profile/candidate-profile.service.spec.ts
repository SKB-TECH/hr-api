import { CandidateProfilesService } from './candidate-profile.service';

describe('CandidateProfilesService', () => {
  it('flattens candidateProfile.phoneNumber for the web profile contract', async () => {
    const userRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'user-id',
        password: 'secret',
        phone: null,
        candidateProfile: {
          id: 'candidate-id',
          phoneNumber: '+243812345678',
        },
      }),
    };
    const service = new CandidateProfilesService(
      userRepo as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.getCandidateProfile('user-id');

    expect(result.phoneNumber).toBe('+243812345678');
    expect(result).not.toHaveProperty('password');
  });
});
