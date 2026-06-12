import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { JwtTokenService } from '@/libs/jwt/jwt-token.service';
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

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtTokenService, useValue: mockJwtTokenService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'CANDIDATE' as any,
      });

      expect(result.user.email).toBe('john@example.com');
      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockJwtTokenService.storeRefreshToken).toHaveBeenCalledWith(
        'uuid-user-1',
        'refresh',
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: 'CANDIDATE' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should fire an audit log on successful registration', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      await service.register({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'CANDIDATE' as any,
      });

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REGISTER', module: 'auth' }),
      );
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

    it('should update lastLogin on successful login', async () => {
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

      expect(mockUsersService.update).toHaveBeenCalledWith(
        'uuid-user-1',
        expect.objectContaining({ lastLogin: expect.any(Date) }),
      );
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

    it('should update lastLogin on Google login', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        ...mockUser,
        provider: 'google',
      });
      mockUsersService.update.mockResolvedValue(mockUser);

      await service.googleLogin({
        email: 'john@example.com',
        fullName: 'John Doe',
        avatar: 'https://avatar.url',
      });

      expect(mockUsersService.update).toHaveBeenCalledWith(
        'uuid-user-1',
        expect.objectContaining({ lastLogin: expect.any(Date) }),
      );
    });
  });
});
