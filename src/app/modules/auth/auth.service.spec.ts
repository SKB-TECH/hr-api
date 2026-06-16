import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { JwtTokenService } from '@/libs/jwt/jwt-token.service';
import { OtpService } from '@/libs/otp/otp.service';
import { EmailPublisher } from '@/libs/pubsub/publishers/email.publisher';
import { RedisService } from '@/libs/redis/redis.service';
import { I18nService } from '@/libs/i18n/i18n.service';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'uuid-user-1',
  email: 'john@example.com',
  password: 'hashed_password',
  phone: null,
  fullName: 'John Doe',
  role: 'CANDIDATE',
  status: 'active',
  provider: 'local',
  avatar: null,
  emailVerified: false,
  phoneVerified: false,
  lastLogin: null,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  createPendingUser: jest.fn(),
  activateUser: jest.fn(),
};

const mockJwtTokenService = {
  generateTokenPair: jest
    .fn()
    .mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }),
  storeRefreshToken: jest.fn().mockResolvedValue(undefined),
  validateRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
};

const mockAuditLogService = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockOtpService = {
  generate: jest.fn().mockResolvedValue('123456'),
  verify: jest.fn().mockResolvedValue(undefined),
};

const mockEmailPublisher = {
  publishOtpEmail: jest.fn().mockResolvedValue(undefined),
  publishWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  publishPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  publishPasswordChangedEmail: jest.fn().mockResolvedValue(undefined),
};

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

const mockI18n = {
  t: jest.fn((key: string) => key),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtTokenService, useValue: mockJwtTokenService },
        { provide: AuditLogService, useValue: mockAuditLogService },
        { provide: OtpService, useValue: mockOtpService },
        { provide: EmailPublisher, useValue: mockEmailPublisher },
        { provide: RedisService, useValue: mockRedisService },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should store a pending registration and publish an OTP email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.register({
        fullName: 'John Doe',
        email: 'john@example.com',
        acceptTerms: true,
      });

      expect(result.requestId).toBeDefined();
      expect(result.channel).toBe('email');
      expect(result.destination).toBe('john@example.com');
      expect(mockRedisService.set).toHaveBeenCalled();
      expect(mockOtpService.generate).toHaveBeenCalledWith(result.requestId);
      expect(mockEmailPublisher.publishOtpEmail).toHaveBeenCalledWith(
        'john@example.com',
        '123456',
      );
    });

    it('should reject when terms are not accepted', async () => {
      await expect(
        service.register({
          fullName: 'John Doe',
          email: 'john@example.com',
          acceptTerms: false,
        }),
      ).rejects.toThrow();
    });

    it('should reject when the email is already registered', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          fullName: 'John Doe',
          email: 'john@example.com',
          acceptTerms: true,
        }),
      ).rejects.toThrow();
    });
  });

  describe('verifyOtp', () => {
    it('should create a pending user and return tokens', async () => {
      const pendingUser = { ...mockUser, status: 'pending' };
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({
          fullName: 'John Doe',
          email: 'john@example.com',
          role: 'CANDIDATE',
          acceptTerms: true,
        }),
      );
      mockUsersService.createPendingUser.mockResolvedValue(pendingUser);

      const result = await service.verifyOtp({
        requestId: 'req-1',
        otp: '123456',
      });

      expect(mockOtpService.verify).toHaveBeenCalledWith('req-1', '123456');
      expect(result.user.email).toBe('john@example.com');
      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REGISTER', module: 'auth' }),
      );
    });

    it('should reject when there is no pending registration', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ requestId: 'req-1', otp: '123456' }),
      ).rejects.toThrow();
    });
  });

  describe('setupPassword', () => {
    it('should activate a pending user', async () => {
      const pendingUser = { ...mockUser, status: 'pending' };
      mockUsersService.findById.mockResolvedValue(pendingUser);
      mockUsersService.activateUser.mockResolvedValue({
        ...mockUser,
        status: 'active',
      });

      const result = await service.setupPassword('uuid-user-1', {
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      expect(mockUsersService.activateUser).toHaveBeenCalled();
      expect(result.user).not.toHaveProperty('password');
      expect(mockEmailPublisher.publishWelcomeEmail).toHaveBeenCalled();
    });

    it('should reject when passwords do not match', async () => {
      await expect(
        service.setupPassword('uuid-user-1', {
          password: 'Password123',
          confirmPassword: 'Different123',
        }),
      ).rejects.toThrow();
    });

    it('should reject when the password is already set', async () => {
      mockUsersService.findById.mockResolvedValue({
        ...mockUser,
        status: 'active',
      });

      await expect(
        service.setupPassword('uuid-user-1', {
          password: 'Password123',
          confirmPassword: 'Password123',
        }),
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login and return tokens', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('john@example.com');
      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject a pending user that has not set a password', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        status: 'pending',
        password: null,
      });

      await expect(
        service.login({ email: 'john@example.com', password: 'password123' }),
      ).rejects.toThrow();
    });

    it('should fire an audit log on successful login', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });
      mockUsersService.update.mockResolvedValue(mockUser);

      await service.login({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN', module: 'auth' }),
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashed = await bcrypt.hash('correctpassword', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });

      await expect(
        service.login({ email: 'john@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token and audit', async () => {
      const result = await service.logout('uuid-user-1');

      expect(result).toEqual({ success: true });
      expect(mockJwtTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'uuid-user-1',
      );
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGOUT', module: 'auth' }),
      );
    });
  });

  describe('refresh', () => {
    it('should rotate tokens for a valid refresh token', async () => {
      mockJwtTokenService.validateRefreshToken.mockResolvedValue(true);
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.refresh('uuid-user-1', 'refresh');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockJwtTokenService.storeRefreshToken).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for an invalid refresh token', async () => {
      mockJwtTokenService.validateRefreshToken.mockResolvedValue(false);

      await expect(service.refresh('uuid-user-1', 'bad')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when the user no longer exists', async () => {
      mockJwtTokenService.validateRefreshToken.mockResolvedValue(true);
      mockUsersService.findById.mockResolvedValue(null);

      await expect(service.refresh('uuid-user-1', 'refresh')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('googleLogin', () => {
    it('should create a new user and return tokens if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({
        ...mockUser,
        provider: 'google',
      });
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await service.googleLogin({
        email: 'john@example.com',
        fullName: 'John Doe',
        avatar: 'https://avatar.url',
      });

      expect(result.user.email).toBe('john@example.com');
      expect(result.user).not.toHaveProperty('password');
      expect(mockUsersService.create).toHaveBeenCalledTimes(1);
    });

    it('should return tokens for an existing Google user without creating a new one', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        provider: 'google',
      });
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await service.googleLogin({
        email: 'john@example.com',
        fullName: 'John Doe',
        avatar: 'https://avatar.url',
      });

      expect(result.user.email).toBe('john@example.com');
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('set-password (authenticated)', () => {
    it('should verify the current password and send an OTP', async () => {
      const hashed = await bcrypt.hash('current123', 10);
      mockUsersService.findById.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });

      const result = await service.setPasswordVerify(
        'uuid-user-1',
        'current123',
      );

      expect(result.requestId).toBeDefined();
      expect(mockEmailPublisher.publishOtpEmail).toHaveBeenCalled();
    });

    it('should reject an incorrect current password', async () => {
      const hashed = await bcrypt.hash('current123', 10);
      mockUsersService.findById.mockResolvedValue({
        ...mockUser,
        password: hashed,
      });

      await expect(
        service.setPasswordVerify('uuid-user-1', 'wrong'),
      ).rejects.toThrow();
    });

    it('should confirm the OTP and return a reset token', async () => {
      mockRedisService.get.mockResolvedValue('uuid-user-1');

      const result = await service.setPasswordConfirmOtp(
        'uuid-user-1',
        'req-1',
        '123456',
      );

      expect(mockOtpService.verify).toHaveBeenCalledWith('req-1', '123456');
      expect(result.resetToken).toBeDefined();
    });

    it('should set a new password and revoke refresh tokens', async () => {
      mockRedisService.get.mockResolvedValue('uuid-user-1');

      const result = await service.setNewPassword(
        'uuid-user-1',
        'reset-token',
        'NewPass123',
        'NewPass123',
      );

      expect(mockUsersService.update).toHaveBeenCalledWith(
        'uuid-user-1',
        expect.objectContaining({ password: expect.any(String) }),
      );
      expect(mockJwtTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'uuid-user-1',
      );
      expect(result.message).toBeDefined();
    });

    it('should reject a mismatched new password', async () => {
      await expect(
        service.setNewPassword(
          'uuid-user-1',
          'reset-token',
          'NewPass123',
          'Other123',
        ),
      ).rejects.toThrow();
    });
  });

  describe('reset-password (public)', () => {
    it('should send a reset OTP for a known account', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('john@example.com');

      expect(result.requestId).toBeDefined();
      expect(mockEmailPublisher.publishPasswordResetEmail).toHaveBeenCalled();
    });

    it('should reject an unknown account', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nobody@example.com'),
      ).rejects.toThrow();
    });

    it('should confirm the OTP and return a reset token', async () => {
      mockRedisService.get.mockResolvedValue('uuid-user-1');

      const result = await service.forgotPasswordConfirmOtp('req-1', '123456');

      expect(result.resetToken).toBeDefined();
    });

    it('should reset the password and auto-login', async () => {
      mockRedisService.get.mockResolvedValue('uuid-user-1');
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await service.resetPassword(
        'reset-token',
        'NewPass123',
        'NewPass123',
      );

      expect(mockUsersService.update).toHaveBeenCalled();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockEmailPublisher.publishPasswordChangedEmail).toHaveBeenCalled();
    });

    it('should reject an invalid reset token', async () => {
      mockRedisService.get.mockResolvedValue(null);

      await expect(
        service.resetPassword('bad-token', 'NewPass123', 'NewPass123'),
      ).rejects.toThrow();
    });
  });
});
