import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  refresh: jest.fn(),
  googleLogin: jest.fn(),
};

const mockUser = {
  id: 'uuid-user-1',
  email: 'john@example.com',
  fullName: 'John Doe',
  role: 'CANDIDATE',
};

const mockTokens = {
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token',
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register and return user with tokens', async () => {
      mockAuthService.register.mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const dto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'CANDIDATE' as any,
      };

      const result = await controller.register(dto);

      expect(result.user.email).toBe('john@example.com');
      expect(result.accessToken).toBeDefined();
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should call authService.login and return user with tokens', async () => {
      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const dto = {
        email: 'john@example.com',
        password: 'password123',
        rememberMe: false,
      };
      const result = await controller.login(dto);

      expect(result.user.email).toBe('john@example.com');
      expect(result.accessToken).toBeDefined();
      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with the refresh token', async () => {
      mockAuthService.logout.mockResolvedValue({ success: true });

      const result = await controller.logout({
        refreshToken: 'mock_refresh_token',
      });

      expect(result).toEqual({ success: true });
      expect(mockAuthService.logout).toHaveBeenCalledWith('mock_refresh_token');
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh and return new access token', async () => {
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new_access_token',
      });

      const result = await controller.refresh({
        refreshToken: 'mock_refresh_token',
      });

      expect(result.accessToken).toBe('new_access_token');
      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        'mock_refresh_token',
      );
    });
  });

  describe('me', () => {
    it('should return the current user from JWT payload', () => {
      const jwtUser = {
        id: 'uuid-user-1',
        email: 'john@example.com',
        role: 'CANDIDATE',
      };
      const result = controller.me(jwtUser);
      expect(result).toEqual(jwtUser);
    });
  });
});
