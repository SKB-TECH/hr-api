import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'uuid-user-1',
  email: 'jake@example.com',
  password: 'hashed_password',
  firstName: 'Jake',
  lastName: 'Gyll',
  role: 'CANDIDATE',
  status: 'active',
  provider: 'local',
  avatar: null,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUsersRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteRefreshTokens: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('updateEmail', () => {
    it('should update email and set emailVerified to false', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.update.mockResolvedValue({ ...mockUser, email: 'new@example.com', emailVerified: false });

      const result = await service.updateEmail('uuid-user-1', { email: 'new@example.com' });

      expect(result.email).toBe('new@example.com');
      expect(result.emailVerified).toBe(false);
      expect(result).not.toHaveProperty('password');
      expect(mockUsersRepository.update).toHaveBeenCalledWith('uuid-user-1', {
        email: 'new@example.com',
        emailVerified: false,
      });
    });

    it('should throw ConflictException if email is taken by another user', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue({ ...mockUser, id: 'other-user-id' });

      await expect(
        service.updateEmail('uuid-user-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to the same email (own email)', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      mockUsersRepository.update.mockResolvedValue({ ...mockUser, emailVerified: false });

      const result = await service.updateEmail('uuid-user-1', { email: 'jake@example.com' });
      expect(result).toBeDefined();
    });
  });

  describe('updatePassword', () => {
    it('should update password when old password is correct', async () => {
      const hashed = await bcrypt.hash('oldpassword123', 10);
      mockUsersRepository.findById.mockResolvedValue({ ...mockUser, password: hashed });
      mockUsersRepository.update.mockResolvedValue(mockUser);

      const result = await service.updatePassword('uuid-user-1', {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      });

      expect(result).toEqual({ success: true });
      expect(mockUsersRepository.update).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when old password is wrong', async () => {
      const hashed = await bcrypt.hash('correctpassword', 10);
      mockUsersRepository.findById.mockResolvedValue({ ...mockUser, password: hashed });

      await expect(
        service.updatePassword('uuid-user-1', {
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersRepository.findById.mockResolvedValue(null);

      await expect(
        service.updatePassword('bad-id', {
          oldPassword: 'oldpassword123',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException for OAuth users with no password', async () => {
      mockUsersRepository.findById.mockResolvedValue({ ...mockUser, password: null, provider: 'google' });

      await expect(
        service.updatePassword('uuid-user-1', {
          oldPassword: 'anything',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('closeAccount', () => {
    it('should soft delete user and clear refresh tokens', async () => {
      mockUsersRepository.deleteRefreshTokens.mockResolvedValue(undefined);
      mockUsersRepository.update.mockResolvedValue({ ...mockUser, status: 'deleted' });

      const result = await service.closeAccount('uuid-user-1');

      expect(result).toEqual({ success: true });
      expect(mockUsersRepository.deleteRefreshTokens).toHaveBeenCalledWith('uuid-user-1');
      expect(mockUsersRepository.update).toHaveBeenCalledWith('uuid-user-1', { status: 'deleted' });
    });
  });
});
