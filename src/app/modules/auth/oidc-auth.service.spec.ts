import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { OidcAuthService } from './oidc-auth.service';
import { OAuthProvider } from '../users/entities/oauth-account.entity';
import { AccountProfile } from './dto/switch-profile.dto';
import { User } from '../users/entities/user.entity';
import { UserRole } from '@/utils/enums';

jest.mock('openid-client', () => ({
  ClientSecretPost: jest.fn(() => 'client-auth'),
  discovery: jest.fn(),
  randomPKCECodeVerifier: jest.fn(() => 'test-verifier'),
  calculatePKCECodeChallenge: jest.fn().mockResolvedValue('test-challenge'),
  randomState: jest.fn(() => 'test-state'),
  randomNonce: jest.fn(() => 'test-nonce'),
  buildAuthorizationUrl: jest.fn(
    () => new URL('https://idp.example/authorize'),
  ),
  authorizationCodeGrant: jest.fn(),
  fetchUserInfo: jest.fn(),
}));

const oidcMock = jest.requireMock('openid-client') as {
  discovery: jest.Mock;
  buildAuthorizationUrl: jest.Mock;
  authorizationCodeGrant: jest.Mock;
  fetchUserInfo: jest.Mock;
  randomPKCECodeVerifier: jest.Mock;
  calculatePKCECodeChallenge: jest.Mock;
  randomState: jest.Mock;
  randomNonce: jest.Mock;
  ClientSecretPost: jest.Mock;
};

const mockUser = {
  id: 'user-id',
  email: 'person@example.com',
  fullName: 'Person Example',
  password: null,
  role: UserRole.CANDIDATE,
  profiles: ['CANDIDATE'],
  activeProfile: 'CANDIDATE',
};

const mockRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockUsers = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  createOAuthUser: jest.fn(),
};

const mockAuth = {
  createOAuthSession: jest.fn(),
};

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockOtp = {
  generate: jest.fn(),
  verify: jest.fn(),
};

const mockEmail = {
  publishOtpEmail: jest.fn(),
};

const mockConfig = {
  get: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn(),
};

function configValue(key: string) {
  const values: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'google-client',
    GOOGLE_CLIENT_SECRET: 'google-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/proxy/auth/google/callback',
    LINKEDIN_CLIENT_ID: 'linkedin-client',
    LINKEDIN_CLIENT_SECRET: 'linkedin-secret',
    LINKEDIN_CALLBACK_URL:
      'http://localhost:3000/api/proxy/auth/linkedin/callback',
    FRONTEND_URL: 'http://localhost:3000',
  };
  return values[key];
}

function makeService() {
  return new OidcAuthService(
    mockRepo as any,
    mockUsers as any,
    mockAuth as any,
    mockRedis as any,
    mockOtp as any,
    mockEmail as any,
    mockConfig as any,
    mockDataSource as any,
  );
}

function stateAttempt(overrides: Record<string, unknown> = {}) {
  return {
    provider: OAuthProvider.GOOGLE,
    codeVerifier: 'test-verifier',
    nonce: 'test-nonce',
    mode: 'login',
    portal: AccountProfile.CANDIDATE,
    locale: 'en',
    returnPath: '/candidate',
    ...overrides,
  };
}

function mockValidIdentity(
  claims: Record<string, unknown> = {
    sub: 'provider-id',
    email: 'person@example.com',
    email_verified: true,
    name: 'Person Example',
  },
  info: Record<string, unknown> = {},
) {
  oidcMock.authorizationCodeGrant.mockResolvedValue({
    access_token: 'access-token',
    claims: () => claims,
  });
  oidcMock.fetchUserInfo.mockResolvedValue(info);
}

describe('OidcAuthService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockConfig.get.mockImplementation(configValue);
    mockRepo.create.mockImplementation((value) => value);
    oidcMock.randomPKCECodeVerifier.mockReturnValue('test-verifier');
    oidcMock.calculatePKCECodeChallenge.mockResolvedValue('test-challenge');
    oidcMock.randomState.mockReturnValue('test-state');
    oidcMock.randomNonce.mockReturnValue('test-nonce');
    oidcMock.ClientSecretPost.mockReturnValue('client-auth');
    oidcMock.buildAuthorizationUrl.mockReturnValue(
      new URL('https://idp.example/authorize'),
    );
    oidcMock.discovery.mockResolvedValue({ issuer: 'test' });
    mockRedis.get.mockResolvedValue(JSON.stringify(stateAttempt()));
    mockUsers.findByEmail.mockResolvedValue(null);
    mockUsers.findById.mockResolvedValue(mockUser);
    mockUsers.createOAuthUser.mockResolvedValue(mockUser);
    mockAuth.createOAuthSession.mockResolvedValue({
      accessToken: 'app-access',
      refreshToken: 'app-refresh',
    });
    mockOtp.generate.mockResolvedValue('123456');
    mockOtp.verify.mockResolvedValue(undefined);
  });

  it.each([
    [OAuthProvider.GOOGLE, 'GOOGLE'],
    [OAuthProvider.LINKEDIN, 'LINKEDIN'],
  ])('creates a new %s user after verified OIDC identity', async (provider) => {
    mockRedis.get.mockResolvedValue(JSON.stringify(stateAttempt({ provider })));
    mockValidIdentity();
    const service = makeService();

    const result = await service.callback(
      provider,
      { state: 'test-state', code: 'authorization-code' },
      'test-state',
      'web',
    );

    expect(result.kind).toBe('session');
    expect(mockUsers.createOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'person@example.com',
        role: UserRole.CANDIDATE,
        emailVerified: true,
      }),
      provider,
      'provider-id',
    );
    expect(mockAuth.createOAuthSession).toHaveBeenCalledWith(
      'user-id',
      'web',
      AccountProfile.CANDIDATE,
    );
  });

  it('uses the associated identity to log in without matching by email', async () => {
    mockValidIdentity();
    mockRepo.findOne.mockResolvedValue({
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-id',
      userId: 'user-id',
    });

    const service = makeService();

    const result = await service.callback(
      OAuthProvider.GOOGLE,
      { state: 'test-state', code: 'authorization-code' },
      'test-state',
      'web',
    );

    expect(result.kind).toBe('session');
    expect(mockUsers.findByEmail).not.toHaveBeenCalled();
    expect(mockUsers.createOAuthUser).not.toHaveBeenCalled();
  });

  it('requires OTP to recover an existing legacy Google account without a stored subject', async () => {
    mockValidIdentity();
    mockRepo.findOne.mockResolvedValue(null);
    mockUsers.findByEmail.mockResolvedValue({
      ...mockUser,
      provider: 'google',
    });
    const service = makeService();

    const result = await service.callback(
      OAuthProvider.GOOGLE,
      { state: 'test-state', code: 'authorization-code' },
      'test-state',
      'web',
    );

    expect(result.kind).toBe('email-required');
    expect(mockUsers.createOAuthUser).not.toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^oauth:pending:/),
      expect.stringContaining('"legacyUserId":"user-id"'),
      600,
    );
  });

  it('links and signs in a legacy Google account only after email OTP verification', async () => {
    const pending = {
      provider: OAuthProvider.GOOGLE,
      providerAccountId: 'provider-id',
      fullName: 'Person Example',
      avatar: null,
      email: 'person@example.com',
      legacyUserId: 'user-id',
      attempt: stateAttempt(),
    };
    mockRedis.get.mockResolvedValue(JSON.stringify(pending));
    mockRepo.findOne.mockResolvedValue(null);
    const service = makeService();

    const result = await service.verifyEmailAndCreateAccount(
      'email-ticket',
      '123456',
      'web',
    );

    expect(mockOtp.verify).toHaveBeenCalledWith('email-ticket', '123456');
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        providerAccountId: 'provider-id',
      }),
    );
    expect(mockAuth.createOAuthSession).toHaveBeenCalledWith(
      'user-id',
      'web',
      AccountProfile.CANDIDATE,
    );
    expect(result.redirectPath).toBe('/candidate');
  });

  it('associates a provider only with the authenticated target user', async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify(stateAttempt({ mode: 'link', userId: 'user-id' })),
    );
    mockValidIdentity({ sub: 'provider-id' });
    mockRepo.findOne.mockResolvedValue(null);
    const service = makeService();

    const result = await service.callback(
      OAuthProvider.GOOGLE,
      { state: 'test-state', code: 'authorization-code' },
      'test-state',
      'web',
    );

    expect(result.kind).toBe('linked');
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-id',
        provider: OAuthProvider.GOOGLE,
        providerAccountId: 'provider-id',
      }),
    );
    expect(mockUsers.findByEmail).not.toHaveBeenCalled();
  });

  it('returns a clear redirect after consent is refused', async () => {
    const service = makeService();

    const result = await service.callback(
      OAuthProvider.GOOGLE,
      { state: 'test-state', error: 'access_denied' },
      'test-state',
      'web',
    );

    expect(result).toEqual({
      kind: 'redirect',
      redirectUrl: 'http://localhost:3000/sign-in?error=oauth_denied',
    });
    expect(oidcMock.authorizationCodeGrant).not.toHaveBeenCalled();
  });

  it('uses the registered frontend callback origin when API frontend config is stale', () => {
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'FRONTEND_URL') return 'https://localhost:3000';
      if (key === 'GOOGLE_CALLBACK_URL') {
        return 'https://fast2hire.com/api/proxy/auth/google/callback';
      }
      return configValue(key);
    });
    const service = makeService();

    expect(
      service.fallbackErrorRedirect(
        'en',
        'oauth_callback_failed',
        OAuthProvider.GOOGLE,
      ),
    ).toBe('https://fast2hire.com/sign-in?error=oauth_callback_failed');
  });

  it('requires an email OTP when the provider has no verified email', async () => {
    mockRedis.get.mockResolvedValue(
      JSON.stringify(stateAttempt({ provider: OAuthProvider.LINKEDIN })),
    );
    mockValidIdentity({ sub: 'provider-id', email_verified: false });
    const service = makeService();

    const result = await service.callback(
      OAuthProvider.LINKEDIN,
      { state: 'test-state', code: 'authorization-code' },
      'test-state',
      'web',
    );

    expect(result.kind).toBe('email-required');
    expect(mockUsers.createOAuthUser).not.toHaveBeenCalled();
    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^oauth:pending:/),
      expect.stringContaining('"providerAccountId":"provider-id"'),
      600,
    );
  });

  it('does not trust an unverified userinfo email based on a different verified token email', async () => {
    mockValidIdentity(
      {
        sub: 'provider-id',
        email: 'verified@example.com',
        email_verified: true,
      },
      {
        email: 'unverified@example.com',
        email_verified: false,
      },
    );
    const service = makeService();

    await service.callback(
      OAuthProvider.GOOGLE,
      { state: 'test-state', code: 'authorization-code' },
      'test-state',
      'web',
    );

    expect(mockUsers.createOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'verified@example.com' }),
      OAuthProvider.GOOGLE,
      'provider-id',
    );
  });

  it('starts OIDC with state, nonce and S256 PKCE for the requested provider', async () => {
    const service = makeService();

    const result = await service.begin(OAuthProvider.LINKEDIN, {
      locale: 'fr',
      portal: 'COMPANY',
      returnTo: '/fr/company/jobs',
    });

    expect(result.state).toBe('test-state');
    expect(oidcMock.discovery).toHaveBeenCalledWith(
      new URL('https://www.linkedin.com/oauth'),
      'linkedin-client',
      { client_secret: 'linkedin-secret' },
      'client-auth',
    );
    expect(oidcMock.buildAuthorizationUrl).toHaveBeenCalledWith(
      { issuer: 'test' },
      expect.objectContaining({
        scope: 'openid profile email',
        state: 'test-state',
        nonce: 'test-nonce',
        code_challenge_method: 'S256',
      }),
    );
    expect(mockRedis.set).toHaveBeenCalledWith(
      'oauth:state:test-state',
      expect.stringContaining('"returnPath":"/fr/company/jobs"'),
      600,
    );
  });

  it('rejects invalid ID tokens and state values', async () => {
    oidcMock.authorizationCodeGrant.mockRejectedValue(
      new UnauthorizedException('invalid token'),
    );
    const service = makeService();

    await expect(
      service.callback(
        OAuthProvider.GOOGLE,
        { state: 'test-state', code: 'invalid' },
        'test-state',
        'web',
      ),
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      service.callback(
        OAuthProvider.GOOGLE,
        { state: 'wrong-state', code: 'code' },
        'test-state',
        'web',
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('does not merge an unlinked provider into an account with the same email', async () => {
    mockValidIdentity();
    mockRepo.findOne.mockResolvedValue(null);
    mockUsers.findByEmail.mockResolvedValue(mockUser);
    const service = makeService();

    await expect(
      service.callback(
        OAuthProvider.GOOGLE,
        { state: 'test-state', code: 'authorization-code' },
        'test-state',
        'web',
      ),
    ).rejects.toThrow(ConflictException);
    expect(mockUsers.createOAuthUser).not.toHaveBeenCalled();
    expect(mockRepo.save).not.toHaveBeenCalled();
  });

  it('prevents unlinking the last usable sign-in method', async () => {
    const manager = {
      getRepository: (entity: unknown) =>
        entity === User
          ? {
              findOne: jest.fn().mockResolvedValue({
                ...mockUser,
                password: null,
              }),
            }
          : {
              findOne: jest.fn().mockResolvedValue({ id: 'account-id' }),
              count: jest.fn().mockResolvedValue(1),
              remove: jest.fn(),
            },
    };
    mockDataSource.transaction.mockImplementation((work) => work(manager));
    const service = makeService();

    await expect(
      service.unlinkAccount('user-id', OAuthProvider.GOOGLE),
    ).rejects.toThrow(ForbiddenException);
  });

  it('accepts only same-origin browser mutations', () => {
    const service = makeService();

    expect(() =>
      service.assertFrontendOrigin('http://localhost:3000'),
    ).not.toThrow();
    expect(() => service.assertFrontendOrigin('https://evil.example')).toThrow(
      ForbiddenException,
    );
    expect(() => service.assertFrontendOrigin(undefined)).toThrow(
      ForbiddenException,
    );
  });
});
