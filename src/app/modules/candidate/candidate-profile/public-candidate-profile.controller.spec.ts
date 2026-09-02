import { GUARDS_METADATA } from '@nestjs/common/constants';
import { PublicCandidateProfilesController } from './public-candidate-profile.controller';

describe('PublicCandidateProfilesController', () => {
  const service = { getPublicProfile: jest.fn() };
  const controller = new PublicCandidateProfilesController(service as any);

  beforeEach(() => jest.clearAllMocks());

  it('returns a public profile without controller-level authentication guards', async () => {
    service.getPublicProfile.mockResolvedValue({
      id: 'profile-id',
      fullName: 'Public Candidate',
    });

    const result = await controller.findOne('profile-id');

    expect(result.data.fullName).toBe('Public Candidate');
    expect(service.getPublicProfile).toHaveBeenCalledWith('profile-id');
    expect(
      Reflect.getMetadata(GUARDS_METADATA, PublicCandidateProfilesController),
    ).toBeUndefined();
  });
});
