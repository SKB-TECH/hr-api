import { CandidateEducationService } from './candidate-education.service';
import { CandidateEducationRepository } from './candidate-education.repository';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CandidateEducationService', () => {
  let service: CandidateEducationService;
  let repo: jest.Mocked<CandidateEducationRepository>;

  const mockProfile = { id: 'profile-uuid-1', userId: 'user-1' };

  const mockEducation = {
    id: 'edu-uuid-1',
    candidateId: 'profile-uuid-1',
  };

  beforeEach(() => {
    repo = {
      getProfileByUserId: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    service = new CandidateEducationService(repo);
  });

  // -------------------------
  // ADD
  // -------------------------
  describe('add', () => {
    it('should create education when profile exists', async () => {
      repo.getProfileByUserId.mockResolvedValue(mockProfile as any);
      repo.create.mockResolvedValue(mockEducation as any);

      const result = await service.add('user-1', { schoolName: 'Test School' });

      expect(repo.getProfileByUserId).toHaveBeenCalledWith('user-1');
      expect(repo.create).toHaveBeenCalledWith('profile-uuid-1', {
        schoolName: 'Test School',
      });
      expect(result).toEqual(mockEducation);
    });

    it('should throw NotFoundException if profile not found', async () => {
      repo.getProfileByUserId.mockResolvedValue(null as any);

      await expect(
        service.add('user-1', { schoolName: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------
  // GET ALL
  // -------------------------
  describe('getAll', () => {
    it('should return educations if profile exists', async () => {
      repo.getProfileByUserId.mockResolvedValue(mockProfile as any);
      repo.findMany.mockResolvedValue([mockEducation] as any);

      const result = await service.getAll('user-1');

      expect(repo.findMany).toHaveBeenCalledWith('profile-uuid-1');
      expect(result).toEqual([mockEducation]);
    });

    it('should return empty array if profile not found', async () => {
      repo.getProfileByUserId.mockResolvedValue(null as any);

      const result = await service.getAll('user-1');

      expect(result).toEqual([]);
    });
  });

  // -------------------------
  // PATCH
  // -------------------------
  describe('patch', () => {
    it('should update education if owner matches', async () => {
      repo.findById.mockResolvedValue(mockEducation as any);
      repo.getProfileByUserId.mockResolvedValue(mockProfile as any);
      repo.update.mockResolvedValue({ ...mockEducation, title: 'Updated' } as any);

      const result = await service.patch('user-1', 'edu-uuid-1', {
        title: 'Updated',
      });

      expect(repo.update).toHaveBeenCalledWith('edu-uuid-1', {
        title: 'Updated',
      });

      expect(result).toEqual({
        ...mockEducation,
        title: 'Updated',
      });
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      repo.findById.mockResolvedValue({
        id: 'edu-uuid-1',
        candidateId: 'other-profile',
      } as any);

      repo.getProfileByUserId.mockResolvedValue(mockProfile as any);

      await expect(
        service.patch('user-1', 'edu-uuid-1', { title: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if education not found', async () => {
      repo.findById.mockResolvedValue(null as any);
      repo.getProfileByUserId.mockResolvedValue(mockProfile as any);

      await expect(
        service.patch('user-1', 'edu-uuid-1', { title: 'x' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // -------------------------
  // DELETE
  // -------------------------
  describe('remove', () => {
    it('should delete if owner matches', async () => {
      repo.findById.mockResolvedValue(mockEducation as any);
      repo.getProfileByUserId.mockResolvedValue(mockProfile as any);
      repo.delete.mockResolvedValue(mockEducation as any);

      const result = await service.remove('user-1', 'edu-uuid-1');

      expect(repo.delete).toHaveBeenCalledWith('edu-uuid-1');
      expect(result).toEqual(mockEducation);
    });

    it('should throw ForbiddenException if not owner', async () => {
      repo.findById.mockResolvedValue({
        id: 'edu-uuid-1',
        candidateId: 'other-profile',
      } as any);

      repo.getProfileByUserId.mockResolvedValue(mockProfile as any);

      await expect(
        service.remove('user-1', 'edu-uuid-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});