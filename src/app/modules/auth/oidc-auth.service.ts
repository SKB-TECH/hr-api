import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@/libs/env/config.service';
import { RedisService } from '@/libs/redis/redis.service';
import { OtpService } from '@/libs/otp/otp.service';
import { EmailPublisher } from '@/libs/pubsub/publishers/email.publisher';
import { UserRole, UserStatus, AuthProvider } from '@/utils/enums';
import * as oidc from 'openid-client';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OAuthAccount,
  OAuthProvider,
} from '../users/entities/oauth-account.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { ClientType } from './types/client-type.type';
import { AccountProfile } from './dto/switch-profile.dto';
import { User } from '../users/entities/user.entity';

type OAuthAttempt = {
  provider: OAuthProvider;
  codeVerifier: string;
  nonce: string;
  mode: 'login' | 'link';
  userId?: string;
  portal: AccountProfile;
  locale: 'en' | 'fr';
  returnPath: string;
};

type PendingOAuth = {
  provider: OAuthProvider;
  providerAccountId: string;
  fullName: string;
  avatar: string | null;
  email?: string;
  legacyUserId?: string;
  attempt: OAuthAttempt;
};

type OAuthProfile = {
  id: string;
  fullName: string;
  email: string | null;
  avatar: string | null;
};

export type OAuthCallbackResult =
  | {
      kind: 'session';
      tokens: { accessToken: string; refreshToken: string };
      redirectUrl: string;
    }
  | { kind: 'linked'; redirectUrl: string }
  | { kind: 'redirect'; redirectUrl: string }
  | { kind: 'email-required'; redirectUrl: string };

const STATE_TTL_SECONDS = 600;
const PENDING_EMAIL_TTL_SECONDS = 600;
const ISSUERS: Record<OAuthProvider, string> = {
  [OAuthProvider.GOOGLE]: 'https://accounts.google.com',
  [OAuthProvider.LINKEDIN]: 'https://www.linkedin.com/oauth',
};

@Injectable()
export class OidcAuthService {
  private readonly clientPromises = new Map<
    OAuthProvider,
    Promise<oidc.Configuration>
  >();

  constructor(
    @InjectRepository(OAuthAccount)
    private readonly accountRepo: Repository<OAuthAccount>,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly otpService: OtpService,
    private readonly emailPublisher: EmailPublisher,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async begin(
    provider: OAuthProvider,
    options: {
      mode?: 'login' | 'link';
      userId?: string;
      portal?: string;
      locale?: string;
      returnTo?: string;
    } = {},
  ) {
    if (options.mode === 'link' && !options.userId) {
      throw new UnauthorizedException(
        'Authentication required to link accounts',
      );
    }

    const client = await this.client(provider);
    const callbackUrl = this.callbackUrl(provider);
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
    const state = oidc.randomState();
    const nonce = oidc.randomNonce();
    const portal =
      options.portal === 'COMPANY'
        ? AccountProfile.COMPANY
        : AccountProfile.CANDIDATE;
    const locale = options.locale === 'fr' ? 'fr' : 'en';
    const attempt: OAuthAttempt = {
      provider,
      codeVerifier,
      nonce,
      mode: options.mode ?? 'login',
      ...(options.userId ? { userId: options.userId } : {}),
      portal,
      locale,
      returnPath: this.safeReturnPath(
        options.returnTo,
        locale,
        portal,
        provider,
      ),
    };

    await this.redisService.set(
      this.stateKey(state),
      JSON.stringify(attempt),
      STATE_TTL_SECONDS,
    );

    const authorizationUrl = oidc.buildAuthorizationUrl(client, {
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return { state, authorizationUrl: authorizationUrl.toString() };
  }

  async callback(
    provider: OAuthProvider,
    query: Record<string, unknown>,
    stateCookie: string | undefined,
    clientType: ClientType,
  ): Promise<OAuthCallbackResult> {
    const state = typeof query.state === 'string' ? query.state : '';
    if (!state || !stateCookie || state !== stateCookie) {
      throw new UnauthorizedException('Invalid OAuth state');
    }

    const stateKey = this.stateKey(state);
    const stateJson = await this.redisService.get(stateKey);
    if (!stateJson) throw new UnauthorizedException('Expired OAuth state');

    const attempt = JSON.parse(stateJson) as OAuthAttempt;
    if (attempt.provider !== provider) {
      throw new UnauthorizedException('OAuth provider mismatch');
    }
    await this.redisService.del(stateKey);

    if (typeof query.error === 'string') {
      if (
        [
          'access_denied',
          'user_cancelled_login',
          'user_cancelled_authorize',
        ].includes(query.error)
      ) {
        return {
          kind: 'redirect',
          redirectUrl: this.errorRedirect(
            attempt.locale,
            'oauth_denied',
            provider,
          ),
        };
      }
      throw new UnauthorizedException('OAuth authorization failed');
    }

    const client = await this.client(provider);
    const callback = new URL(this.callbackUrl(provider));
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'string') callback.searchParams.set(key, value);
    }

    const tokens = await oidc.authorizationCodeGrant(client, callback, {
      pkceCodeVerifier: attempt.codeVerifier,
      expectedState: state,
      expectedNonce: attempt.nonce,
    });
    const claims = tokens.claims();
    if (!claims?.sub || !tokens.access_token) {
      throw new UnauthorizedException('Invalid identity token');
    }

    const info = await oidc.fetchUserInfo(
      client,
      tokens.access_token,
      claims.sub,
    );
    const userInfoEmail = this.stringClaim(info.email);
    const tokenEmail = this.stringClaim(claims.email);
    const email =
      (info.email_verified === true ? userInfoEmail : null) ??
      (claims.email_verified === true ? tokenEmail : null);
    const profile: OAuthProfile = {
      id: claims.sub,
      email,
      fullName:
        this.stringClaim(info.name) ??
        this.stringClaim(claims.name) ??
        [
          this.stringClaim(claims.given_name),
          this.stringClaim(claims.family_name),
        ]
          .filter(Boolean)
          .join(' '),
      avatar:
        this.stringClaim(info.picture) ??
        this.stringClaim(claims.picture) ??
        null,
    };

    if (attempt.mode === 'link') {
      await this.linkAccount(attempt.userId!, provider, profile.id);
      return {
        kind: 'linked',
        redirectUrl: this.frontendUrl(attempt.returnPath, provider),
      };
    }

    const linkedAccount = await this.accountRepo.findOne({
      where: { provider, providerAccountId: profile.id },
    });
    if (linkedAccount) {
      const user = await this.usersService.findById(linkedAccount.userId);
      if (!user) throw new UnauthorizedException('Account is unavailable');
      const tokens = await this.authService.createOAuthSession(
        user.id,
        clientType,
        attempt.portal,
      );
      return {
        kind: 'session',
        tokens,
        redirectUrl: this.frontendUrl(attempt.returnPath, provider),
      };
    }

    const existingUser = email
      ? await this.usersService.findByEmail(email)
      : null;
    if (
      existingUser &&
      !(
        provider === OAuthProvider.GOOGLE &&
        existingUser.provider === AuthProvider.google
      )
    ) {
      throw new ConflictException(
        'An account already uses this email. Sign in and connect this provider from settings.',
      );
    }

    if (existingUser) {
      return this.createEmailCompletion(
        provider,
        profile,
        attempt,
        existingUser.id,
        email!,
      );
    }

    const newUserAttempt: OAuthAttempt = {
      ...attempt,
      portal: AccountProfile.CANDIDATE,
      returnPath: this.safeReturnPath(
        undefined,
        attempt.locale,
        AccountProfile.CANDIDATE,
        provider,
      ),
    };

    if (!email) {
      return this.createEmailCompletion(provider, profile, newUserAttempt);
    }

    const user = await this.createOAuthUser(provider, profile, email);
    const tokensForNewUser = await this.authService.createOAuthSession(
      user.id,
      clientType,
      newUserAttempt.portal,
    );
    return {
      kind: 'session',
      tokens: tokensForNewUser,
      redirectUrl: this.frontendUrl(newUserAttempt.returnPath, provider),
    };
  }

  async requestEmailVerification(ticket: string, email: string) {
    const pending = await this.getPending(ticket);
    const normalizedEmail = email.trim().toLowerCase();
    if (pending.legacyUserId) {
      const legacyUser = await this.usersService.findById(pending.legacyUserId);
      if (
        !legacyUser ||
        legacyUser.email.trim().toLowerCase() !== normalizedEmail
      ) {
        throw new ConflictException(
          'Use the email address already associated with this legacy account.',
        );
      }
    } else if (await this.usersService.findByEmail(normalizedEmail)) {
      throw new ConflictException(
        'An account already uses this email. Sign in and connect this provider from settings.',
      );
    }

    pending.email = normalizedEmail;
    await this.redisService.set(
      this.pendingKey(ticket),
      JSON.stringify(pending),
      PENDING_EMAIL_TTL_SECONDS,
    );
    const otp = await this.otpService.generate(ticket);
    await this.emailPublisher.publishOtpEmail(normalizedEmail, otp);
    return { destination: normalizedEmail };
  }

  async verifyEmailAndCreateAccount(
    ticket: string,
    otp: string,
    clientType: ClientType,
  ) {
    const pending = await this.getPending(ticket);
    if (!pending.email) {
      throw new ForbiddenException('Request email verification first');
    }
    await this.otpService.verify(ticket, otp);

    if (pending.legacyUserId) {
      const user = await this.usersService.findById(pending.legacyUserId);
      if (
        !user ||
        user.email.trim().toLowerCase() !== pending.email.toLowerCase()
      ) {
        throw new ConflictException(
          'Legacy account recovery is no longer valid',
        );
      }
      await this.linkAccount(
        user.id,
        pending.provider,
        pending.providerAccountId,
      );
      await this.redisService.del(this.pendingKey(ticket));
      const tokens = await this.authService.createOAuthSession(
        user.id,
        clientType,
        pending.attempt.portal,
      );
      return { ...tokens, redirectPath: pending.attempt.returnPath };
    }

    if (await this.usersService.findByEmail(pending.email)) {
      throw new ConflictException(
        'An account already uses this email. Sign in and connect this provider from settings.',
      );
    }

    const user = await this.createOAuthUser(
      pending.provider,
      {
        id: pending.providerAccountId,
        fullName: pending.fullName || pending.email,
        email: pending.email,
        avatar: pending.avatar,
      },
      pending.email,
    );
    await this.redisService.del(this.pendingKey(ticket));
    const tokens = await this.authService.createOAuthSession(
      user.id,
      clientType,
      pending.attempt.portal,
    );
    return { ...tokens, redirectPath: pending.attempt.returnPath };
  }

  async connectedAccounts(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const accounts = await this.accountRepo.find({ where: { userId } });
    const providers = new Set(accounts.map((account) => account.provider));
    return {
      accounts: {
        google: providers.has(OAuthProvider.GOOGLE),
        linkedin: providers.has(OAuthProvider.LINKEDIN),
      },
      hasPassword: Boolean(user.password),
    };
  }

  assertFrontendOrigin(origin: string | undefined) {
    let trustedOrigin: string;
    try {
      trustedOrigin = new URL(
        this.config.get('FRONTEND_URL') ||
          this.config.get('WEB_APP_URL') ||
          'http://localhost:3000',
      ).origin;
      if (!origin || new URL(origin).origin !== trustedOrigin) {
        throw new ForbiddenException('Invalid request origin');
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('Invalid request origin');
    }
  }

  async unlinkAccount(userId: string, provider: OAuthProvider) {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.getRepository(User).findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) throw new NotFoundException('User not found');
      const accountRepo = manager.getRepository(OAuthAccount);
      const account = await accountRepo.findOne({
        where: { userId, provider },
      });
      if (!account) throw new NotFoundException('Connected account not found');
      const count = await accountRepo.count({ where: { userId } });
      if (!user.password && count <= 1) {
        throw new ForbiddenException(
          'Set a password or connect another provider before unlinking this account.',
        );
      }
      await accountRepo.remove(account);
    });
    return this.connectedAccounts(userId);
  }

  fallbackErrorRedirect(locale: string, code: string, provider: OAuthProvider) {
    return this.frontendUrl(
      `/${locale === 'fr' ? 'fr/' : ''}sign-in?error=${encodeURIComponent(code)}`,
      provider,
    );
  }

  private async linkAccount(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Account is unavailable');
    const existing = await this.accountRepo.findOne({
      where: { provider, providerAccountId },
    });
    if (existing && existing.userId !== userId) {
      throw new ConflictException(
        'This provider is connected to another account',
      );
    }
    if (!existing) {
      await this.accountRepo.save(
        this.accountRepo.create({ userId, provider, providerAccountId }),
      );
    }
  }

  private async createOAuthUser(
    provider: OAuthProvider,
    profile: OAuthProfile,
    email: string,
  ): Promise<User> {
    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException(
        'An account already uses this email. Sign in and connect this provider from settings.',
      );
    }
    return this.usersService.createOAuthUser(
      {
        email,
        fullName: profile.fullName || email,
        avatar: profile.avatar,
        provider:
          provider === OAuthProvider.GOOGLE
            ? AuthProvider.google
            : AuthProvider.linkedin,
        role: UserRole.CANDIDATE,
        status: UserStatus.active,
        emailVerified: true,
      },
      provider,
      profile.id,
    );
  }

  private async getPending(ticket: string): Promise<PendingOAuth> {
    const data = await this.redisService.get(this.pendingKey(ticket));
    if (!data) throw new NotFoundException('OAuth email verification expired');
    return JSON.parse(data) as PendingOAuth;
  }

  private async createEmailCompletion(
    provider: OAuthProvider,
    profile: OAuthProfile,
    attempt: OAuthAttempt,
    legacyUserId?: string,
    email?: string,
  ): Promise<OAuthCallbackResult> {
    const ticket = randomUUID();
    const pending: PendingOAuth = {
      provider,
      providerAccountId: profile.id,
      fullName: profile.fullName,
      avatar: profile.avatar,
      ...(email ? { email } : {}),
      ...(legacyUserId ? { legacyUserId } : {}),
      attempt,
    };
    await this.redisService.set(
      this.pendingKey(ticket),
      JSON.stringify(pending),
      PENDING_EMAIL_TTL_SECONDS,
    );
    return {
      kind: 'email-required',
      redirectUrl: this.frontendUrl(
        `/${attempt.locale === 'fr' ? 'fr/' : ''}oauth/complete?ticket=${encodeURIComponent(ticket)}`,
        provider,
      ),
    };
  }

  private async client(provider: OAuthProvider): Promise<oidc.Configuration> {
    const current = this.clientPromises.get(provider);
    if (current) return current;

    const clientId = this.config.get(
      provider === OAuthProvider.GOOGLE
        ? 'GOOGLE_CLIENT_ID'
        : 'LINKEDIN_CLIENT_ID',
    );
    const clientSecret = this.config.get(
      provider === OAuthProvider.GOOGLE
        ? 'GOOGLE_CLIENT_SECRET'
        : 'LINKEDIN_CLIENT_SECRET',
    );
    if (!clientId || !clientSecret) {
      throw new UnauthorizedException(`${provider} OAuth is not configured`);
    }

    const promise = oidc.discovery(
      new URL(ISSUERS[provider]),
      clientId,
      { client_secret: clientSecret },
      oidc.ClientSecretPost(clientSecret),
    );
    this.clientPromises.set(provider, promise);
    try {
      return await promise;
    } catch (error) {
      this.clientPromises.delete(provider);
      throw error;
    }
  }

  private callbackUrl(provider: OAuthProvider): string {
    const value = this.config.get(
      provider === OAuthProvider.GOOGLE
        ? 'GOOGLE_CALLBACK_URL'
        : 'LINKEDIN_CALLBACK_URL',
    );
    if (!value) {
      throw new UnauthorizedException(
        `${provider} callback URL is not configured`,
      );
    }
    return value;
  }

  private frontendUrl(path: string, provider: OAuthProvider): string {
    return new URL(path, `${this.frontendOrigin(provider)}/`).toString();
  }

  private frontendOrigin(provider: OAuthProvider): string {
    const callbackUrl = this.config.get(
      provider === OAuthProvider.GOOGLE
        ? 'GOOGLE_CALLBACK_URL'
        : 'LINKEDIN_CALLBACK_URL',
    );
    if (callbackUrl) {
      const callback = new URL(callbackUrl);
      const expectedPath = `/api/proxy/auth/${provider}/callback`;
      if (
        ['http:', 'https:'].includes(callback.protocol) &&
        callback.pathname === expectedPath &&
        !callback.username &&
        !callback.password
      ) {
        return callback.origin;
      }
    }

    const configuredFrontend =
      this.config.get('FRONTEND_URL') ||
      this.config.get('WEB_APP_URL') ||
      'http://localhost:3000';
    return new URL(configuredFrontend).origin;
  }

  private safeReturnPath(
    value: string | undefined,
    locale: 'en' | 'fr',
    portal: AccountProfile,
    provider: OAuthProvider,
  ): string {
    const defaultPath = `/${locale === 'fr' ? 'fr/' : ''}${portal === AccountProfile.COMPANY ? 'company' : 'candidate'}`;
    if (!value || value.startsWith('//') || value.includes('\\')) {
      return defaultPath;
    }
    try {
      const frontend = new URL(this.frontendOrigin(provider));
      const target = new URL(value, frontend);
      if (
        target.origin !== frontend.origin ||
        !/^\/(?:fr\/)?(?:candidate|company)(?:\/|$)/.test(target.pathname)
      ) {
        return defaultPath;
      }
      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return defaultPath;
    }
  }

  private errorRedirect(
    locale: 'en' | 'fr',
    code: string,
    provider: OAuthProvider,
  ): string {
    return this.frontendUrl(
      `/${locale === 'fr' ? 'fr/' : ''}sign-in?error=${encodeURIComponent(code)}`,
      provider,
    );
  }

  private stateKey(state: string): string {
    return `oauth:state:${state}`;
  }

  private pendingKey(ticket: string): string {
    return `oauth:pending:${ticket}`;
  }

  private stringClaim(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
