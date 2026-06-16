import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CandidateProfile } from '../candidate/candidate-profile/entities/candidate-profile.entity';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { JwtTokenService } from '@/libs/jwt/jwt-token.service';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'uuid-user-1',
  email: 'jake@example.com',
  password: 'hashed_password',
  fullName: 'Jake Gyll',
  role: 'CANDIDATE',
  status: 'active',
  provider: 'local',
  avatar: null,
  emailVerified: true,
  phoneVerified: false,
  lastLogin: null,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockUserRepo = {
  findOne: jest.fn(),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  create: jest.fn((data) => data),
  save: jest.fn(),
};

const mockJwtTokenService = {
  revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
};

const mockCandidateProfileRepo = {
  create: jest.fn((data) => data),
  save: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn(),
};

const mockAuditLogService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(CandidateProfile),
          useValue: mockCandidateProfileRepo,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: JwtTokenService, useValue: mockJwtTokenService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('updateEmail', () => {
    it('should update email and set emailVerified to false', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          email: 'new@example.com',
          emailVerified: false,
        });

      const result = await service.updateEmail('uuid-user-1', {
        email: 'new@example.com',
      });

      expect(result.email).toBe('new@example.com');
      expect(result.emailVerified).toBe(false);
      expect(result).not.toHaveProperty('password');
      expect(mockUserRepo.update).toHaveBeenCalledWith('uuid-user-1', {
        email: 'new@example.com',
        emailVerified: false,
      });
    });

    it('should throw ConflictException if email is taken by another user', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({
        ...mockUser,
        id: 'other-user-id',
      });

      await expect(
        service.updateEmail('uuid-user-1', { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow updating to the same email (own email)', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, emailVerified: false });

      const result = await service.updateEmail('uuid-user-1', {
        email: 'jake@example.com',
      });
      expect(result).toBeDefined();
    });

    it('should fire an audit log with old and new email', async () => {
      mockUserRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          email: 'new@example.com',
          emailVerified: false,
        });

      await service.updateEmail('uuid-user-1', { email: 'new@example.com' });

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE_EMAIL',
          module: 'users',
          oldValues: { email: 'jake@example.com' },
          newValues: { email: 'new@example.com' },
        }),
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password when old password is correct', async () => {
      const hashed = await bcrypt.hash('oldpassword123', 10);
      mockUserRepo.findOne
        .mockResolvedValueOnce({ ...mockUser, password: hashed })
        .mockResolvedValueOnce(mockUser);

      const result = await service.updatePassword('uuid-user-1', {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      });

      expect(result).toEqual({ success: true });
      expect(mockUserRepo.update).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when old password is wrong', async () => {
      const hashed = await bcrypt.hash('correctpassword', 10);
      mockUserRepo.findOne.mockResolvedValueOnce({
        ...mockUser,
        password: hashed,
      });

      await expect(
        service.updatePassword('uuid-user-1', {
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updatePassword('bad-id', {
          oldPassword: 'oldpassword123',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException for OAuth users with no password', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({
        ...mockUser,
        password: null,
        provider: 'google',
      });

      await expect(
        service.updatePassword('uuid-user-1', {
          oldPassword: 'anything',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should fire an audit log on successful password change', async () => {
      const hashed = await bcrypt.hash('oldpassword123', 10);
      mockUserRepo.findOne
        .mockResolvedValueOnce({ ...mockUser, password: hashed })
        .mockResolvedValueOnce(mockUser);

      await service.updatePassword('uuid-user-1', {
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      });

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UPDATE_PASSWORD', module: 'users' }),
      );
    });
  });

  describe('createPendingUser', () => {
    it('should create a pending, email-verified user', async () => {
      const pending = { ...mockUser, status: 'pending', password: null };
      mockDataSource.transaction.mockImplementation(async (cb) =>
        cb({
          getRepository: () => ({
            create: (data: any) => data,
            save: jest.fn().mockResolvedValue(pending),
          }),
        }),
      );

      const result = await service.createPendingUser({
        fullName: 'Jake Gyll',
        email: 'jake@example.com',
      });

      expect(result.status).toBe('pending');
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('activateUser', () => {
    it('should set the password and activate the user', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({
        ...mockUser,
        status: 'active',
      });

      const result = await service.activateUser('uuid-user-1', 'hashed_pw');

      expect(mockUserRepo.update).toHaveBeenCalledWith('uuid-user-1', {
        password: 'hashed_pw',
        status: 'active',
      });
      expect(result.status).toBe('active');
    });

    it('should throw NotFoundException when the user is missing', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.activateUser('bad-id', 'hashed_pw'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('closeAccount', () => {
    it('should soft delete user and revoke refresh token', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({
        ...mockUser,
        status: 'deleted',
        deletedAt: new Date(),
      });

      const result = await service.closeAccount('uuid-user-1');

      expect(result).toEqual({ success: true });
      expect(mockJwtTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'uuid-user-1',
      );
      expect(mockUserRepo.update).toHaveBeenCalledWith(
        'uuid-user-1',
        expect.objectContaining({
          status: 'deleted',
          deletedAt: expect.any(Date),
        }),
      );
    });

    it('should fire an audit log on account closure', async () => {
      mockUserRepo.findOne.mockResolvedValueOnce({
        ...mockUser,
        status: 'deleted',
      });

      await service.closeAccount('uuid-user-1');

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CLOSE_ACCOUNT', module: 'users' }),
      );
    });
  });
});
