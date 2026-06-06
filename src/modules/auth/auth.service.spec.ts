import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuditLogService } from '../audit-logs/audit-log.service';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'uuid-user-1',
  email: 'john@example.com',
  password: 'hashed_password',
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

const mockUsersRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock_token'),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('test_secret'),
};

const mockPrismaService = {
  refreshToken: {
    create: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
  },
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
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return tokens', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.create.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

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
      expect(mockUsersRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

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
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.create.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

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
      mockUsersRepository.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });
      mockUsersRepository.update.mockResolvedValue({ ...mockUser, lastLogin: new Date() });
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login({
        email: 'john@example.com',
        password: 'password123',
        rememberMe: false,
      });

      expect(result.user.email).toBe('john@example.com');
      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should update lastLogin on successful login', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      mockUsersRepository.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });
      mockUsersRepository.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.login({ email: 'john@example.com', password: 'password123' });

      expect(mockUsersRepository.update).toHaveBeenCalledWith(
        'uuid-user-1',
        expect.objectContaining({ lastLogin: expect.any(Date) }),
      );
    });

    it('should fire an audit log on successful login', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      mockUsersRepository.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });
      mockUsersRepository.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.login({ email: 'john@example.com', password: 'password123' });

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN', module: 'auth' }),
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashed = await bcrypt.hash('correctpassword', 10);
      mockUsersRepository.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });

      await expect(
        service.login({ email: 'john@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should issue 30-day refresh token when rememberMe is true', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      mockUsersRepository.findByEmail.mockResolvedValue({ ...mockUser, password: hashed });
      mockUsersRepository.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.login({
        email: 'john@example.com',
        password: 'password123',
        rememberMe: true,
      });

      const createCall = mockPrismaService.refreshToken.create.mock.calls[0][0];
      const expiresAt: Date = createCall.data.expiresAt;
      const diffDays = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeGreaterThan(25);
    });
  });

  describe('logout', () => {
    it('should delete the refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({ userId: 'uuid-user-1', token: 'mock_refresh_token' });
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('mock_refresh_token');

      expect(result).toEqual({ success: true });
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'mock_refresh_token' },
      });
    });

    it('should fire an audit log on logout', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({ userId: 'uuid-user-1', token: 'mock_refresh_token' });
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('mock_refresh_token');

      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGOUT', module: 'auth' }),
      );
    });
  });

  describe('refresh', () => {
    it('should return a new access token for a valid refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        token: 'mock_refresh_token',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        user: mockUser,
      });

      const result = await service.refresh('mock_refresh_token');

      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        token: 'expired_token',
        expiresAt: new Date(Date.now() - 1000),
        user: mockUser,
      });

      await expect(service.refresh('expired_token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unknown refresh token', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh('unknown_token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('googleLogin', () => {
    it('should create a new user and return tokens if user does not exist', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.create.mockResolvedValue({ ...mockUser, provider: 'google' });
      mockUsersRepository.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.googleLogin({
        email: 'john@example.com',
        fullName: 'John Doe',
        avatar: 'https://avatar.url',
      });

      expect(result.user.email).toBe('john@example.com');
      expect(result.user).not.toHaveProperty('password');
      expect(mockUsersRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should return tokens for an existing Google user without creating a new one', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue({ ...mockUser, provider: 'google' });
      mockUsersRepository.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.googleLogin({
        email: 'john@example.com',
        fullName: 'John Doe',
        avatar: 'https://avatar.url',
      });

      expect(result.user.email).toBe('john@example.com');
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
    });

    it('should update lastLogin on Google login', async () => {
      mockUsersRepository.findByEmail.mockResolvedValue({ ...mockUser, provider: 'google' });
      mockUsersRepository.update.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.googleLogin({
        email: 'john@example.com',
        fullName: 'John Doe',
        avatar: 'https://avatar.url',
      });

      expect(mockUsersRepository.update).toHaveBeenCalledWith(
        'uuid-user-1',
        expect.objectContaining({ lastLogin: expect.any(Date) }),
      );
    });
  });
});
