import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  OAuthProviderResponseError,
  OidcAuthService,
} from './oidc-auth.service';

jest.mock('openid-client', () => ({}));

const mockAuthService = {
  login: jest.fn(),
  logout: jest.fn(),
  refresh: jest.fn(),
  session: jest.fn(),
  enableProfile: jest.fn(),
  switchProfile: jest.fn(),
};

const mockOidcAuthService = {
  begin: jest.fn(),
  callback: jest.fn(),
  connectedAccounts: jest.fn(),
  unlinkAccount: jest.fn(),
  requestEmailVerification: jest.fn(),
  verifyEmailAndCreateAccount: jest.fn(),
  fallbackErrorRedirect: jest.fn(),
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

const mobileReq = { headers: { 'x-client-type': 'mobile' } } as any;
const res = { cookie: jest.fn(), clearCookie: jest.fn() } as any;

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: OidcAuthService, useValue: mockOidcAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login and return user with tokens (mobile)', async () => {
      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const dto = { email: 'john@example.com', password: 'password123' };
      const result: any = await controller.login(mobileReq, res, dto);

      expect(result.statusCode).toBe(200);
      expect(result.data.user.email).toBe('john@example.com');
      expect(result.data.accessToken).toBeDefined();
      expect(mockAuthService.login).toHaveBeenCalledWith(dto, 'mobile');
    });
  });

  describe('logout', () => {
    it('should revoke by user id and clear cookies', async () => {
      mockAuthService.logout.mockResolvedValue({ success: true });

      const result: any = await controller.logout(res, { id: 'uuid-user-1' });

      expect(result.statusCode).toBe(200);
      expect(mockAuthService.logout).toHaveBeenCalledWith('uuid-user-1');
      expect(res.clearCookie).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should rotate tokens and return them (mobile)', async () => {
      mockAuthService.refresh.mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });

      const result: any = await controller.refresh(mobileReq, res, {
        id: 'uuid-user-1',
        refreshToken: 'mock_refresh_token',
      });

      expect(result.data.accessToken).toBe('new_access_token');
      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        'uuid-user-1',
        'mock_refresh_token',
        'mobile',
      );
    });
  });

  describe('me', () => {
    it('should return the current user from JWT payload', async () => {
      const jwtUser = {
        id: 'uuid-user-1',
        email: 'john@example.com',
        role: 'CANDIDATE',
      };
      mockAuthService.session.mockResolvedValue(jwtUser);
      const result: any = await controller.me(jwtUser);
      expect(result.data).toEqual(jwtUser);
    });
  });

  it('logs safe provider diagnostics when an OAuth callback fails', async () => {
    mockOidcAuthService.callback.mockRejectedValue(
      new OAuthProviderResponseError('token_exchange', 'invalid_client', 401),
    );
    mockOidcAuthService.fallbackErrorRedirect.mockReturnValue(
      'https://fast2hire.com/fr/sign-in?error=oauth_callback_failed',
    );
    const warn = jest
      .spyOn((controller as any).logger, 'warn')
      .mockImplementation();
    const req = {
      cookies: { oauth_state_google: 'state', NEXT_LOCALE: 'fr' },
      query: { state: 'state', code: 'must-not-be-logged' },
      headers: { 'x-client-type': 'web' },
    } as any;
    const response = {
      setHeader: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    } as any;

    await controller.googleCallback(req, response);

    expect(warn).toHaveBeenCalledWith(
      {
        provider: 'google',
        errorName: 'OAuthProviderResponseError',
        phase: 'token_exchange',
        providerError: 'invalid_client',
        providerStatus: 401,
      },
      'OAuth callback failed',
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain('must-not-be-logged');
  });
});
