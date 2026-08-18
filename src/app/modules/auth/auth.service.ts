import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus, AuthProvider } from '@/utils/enums';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { JwtTokenService } from '@/libs/jwt/jwt-token.service';
import { OtpService } from '@/libs/otp/otp.service';
import { EmailPublisher } from '@/libs/pubsub/publishers/email.publisher';
import { RedisService } from '@/libs/redis/redis.service';
import { I18nService } from '@/libs/i18n/i18n.service';
import { sendError } from '@/helpers/message/sendResult';
import { AuthPortal, LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { PendingRegistration } from './interfaces/pending-registration.interface';
import { ClientType } from './types/client-type.type';

@Injectable()
export class AuthService {
  private readonly PENDING_REG_TTL = 600;
  private readonly RESET_TOKEN_TTL = 300;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly auditLogService: AuditLogService,
    private readonly otpService: OtpService,
    private readonly emailPublisher: EmailPublisher,
    private readonly redisService: RedisService,
    private readonly i18n: I18nService,
  ) {}

  // ----------------------------- Registration -----------------------------

  async register(dto: RegisterDto) {
    if (!dto.acceptTerms) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.terms_required'),
        'BAD_REQUEST',
      );
    }

    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      sendError(
        HttpStatus.CONFLICT,
        this.i18n.t('auth.email_registered'),
        'CONFLICT',
      );
    }

    const requestId = randomUUID();
    const pending: PendingRegistration = {
      fullName: dto.fullName,
      email: dto.email,
      role: dto.role ?? UserRole.CANDIDATE,
      acceptTerms: dto.acceptTerms,
    };
    await this.redisService.set(
      this.pendingRegKey(requestId),
      JSON.stringify(pending),
      this.PENDING_REG_TTL,
    );

    const otp = await this.otpService.generate(requestId);
    await this.emailPublisher.publishOtpEmail(dto.email, otp);

    return {
      message: this.i18n.t('auth.code_sent_email'),
      requestId,
      channel: 'email',
      destination: dto.email,
    };
  }

  async verifyOtp(dto: VerifyOtpDto, clientType: ClientType = 'mobile') {
    const pendingData = await this.redisService.get(
      this.pendingRegKey(dto.requestId),
    );
    if (!pendingData) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.no_pending_registration'),
        'BAD_REQUEST',
      );
      return;
    }

    await this.otpService.verify(dto.requestId, dto.otp);

    const pending = JSON.parse(pendingData) as PendingRegistration;
    const user = await this.usersService.createPendingUser(pending);
    await this.redisService.del(this.pendingRegKey(dto.requestId));

    void this.auditLogService.log({
      userId: user.id,
      action: 'REGISTER',
      module: 'auth',
      newValues: { email: user.email, role: user.role },
    });

    const tokens = await this.generateAndStoreTokens(user, clientType);
    return {
      message: this.i18n.t('auth.identifier_verified_email'),
      user: this.sanitize(user),
      ...tokens,
    };
  }

  async resendOtp(requestId: string) {
    const pending = await this.loadPendingRegistration(requestId);
    if (!pending) return;

    const otp = await this.otpService.generate(requestId);
    await this.emailPublisher.publishOtpEmail(pending.email, otp);

    return {
      message: this.i18n.t('auth.code_resent_email'),
      requestId,
      channel: 'email',
      destination: pending.email,
    };
  }

  async setupPassword(userId: string, dto: SetupPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.passwords_mismatch'),
        'BAD_REQUEST',
      );
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      sendError(
        HttpStatus.NOT_FOUND,
        this.i18n.t('auth.user_not_found'),
        'NOT_FOUND',
      );
      return;
    }

    if (user.status === UserStatus.active) {
      sendError(
        HttpStatus.CONFLICT,
        this.i18n.t('auth.password_already_set'),
        'CONFLICT',
      );
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const activated = await this.usersService.activateUser(userId, hashed);

    if (user.email) {
      this.emailPublisher
        .publishWelcomeEmail(user.email, user.fullName)
        .catch(() => undefined);
    }

    return { user: this.sanitize(activated) };
  }

  // ------------------------------- Session --------------------------------

  async login(dto: LoginDto, clientType: ClientType = 'mobile') {
    const user = await this.usersService.findByEmail(dto.email);

    if (user && user.status === UserStatus.pending) {
      sendError(
        HttpStatus.FORBIDDEN,
        this.i18n.t('auth.password_not_set'),
        'FORBIDDEN',
      );
    }

    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const companyRoles: UserRole[] = [
      UserRole.COMPANY_OWNER,
      UserRole.HR_MANAGER,
      UserRole.RECRUITER,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ];
    const isCompanyAccount = companyRoles.includes(user.role);

    if (dto.portal === AuthPortal.COMPANY && !isCompanyAccount) {
      throw new ForbiddenException(
        'This account is not authorized for the company portal.',
      );
    }

    if (dto.portal === AuthPortal.CANDIDATE && isCompanyAccount) {
      throw new ForbiddenException(
        'This account is not authorized for the candidate portal.',
      );
    }

    await this.usersService.update(user.id, { lastLogin: new Date() });

    void this.auditLogService.log({
      userId: user.id,
      action: 'LOGIN',
      module: 'auth',
      newValues: { email: user.email },
    });

    const tokens = await this.generateAndStoreTokens(user, clientType);
    return { user: this.sanitize(user), ...tokens };
  }

  async refresh(
    userId: string,
    refreshToken: string,
    clientType: ClientType = 'mobile',
  ) {
    const isValid = await this.jwtTokenService.validateRefreshToken(
      userId,
      refreshToken,
    );
    if (!isValid)
      throw new UnauthorizedException('Invalid or expired refresh token');

    const user = await this.usersService.findById(userId);
    if (!user)
      throw new UnauthorizedException('Invalid or expired refresh token');

    return this.generateAndStoreTokens(user, clientType);
  }

  async logout(userId: string) {
    await this.jwtTokenService.revokeRefreshToken(userId);

    void this.auditLogService.log({
      userId,
      action: 'LOGOUT',
      module: 'auth',
    });

    return { success: true };
  }

  async googleLogin(
    googleUser: { email: string; fullName: string; avatar: string },
    clientType: ClientType = 'mobile',
  ) {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      user = await this.usersService.create({
        email: googleUser.email,
        fullName: googleUser.fullName,
        avatar: googleUser.avatar,
        provider: AuthProvider.google,
        role: UserRole.CANDIDATE,
        status: UserStatus.active,
        emailVerified: true,
      });
    }

    await this.usersService.update(user.id, { lastLogin: new Date() });

    void this.auditLogService.log({
      userId: user.id,
      action: 'GOOGLE_LOGIN',
      module: 'auth',
      newValues: { email: user.email },
    });

    const tokens = await this.generateAndStoreTokens(user, clientType);
    return { user: this.sanitize(user), ...tokens };
  }

  // -------------------- Set password (authenticated) ----------------------

  async setPasswordVerify(userId: string, currentPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.password) {
      sendError(
        HttpStatus.UNAUTHORIZED,
        this.i18n.t('auth.incorrect_password'),
        'UNAUTHORIZED',
      );
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      sendError(
        HttpStatus.UNAUTHORIZED,
        this.i18n.t('auth.incorrect_password'),
        'UNAUTHORIZED',
      );
    }

    const requestId = randomUUID();
    await this.redisService.set(
      this.setPasswordKey(requestId),
      userId,
      this.PENDING_REG_TTL,
    );
    const otp = await this.otpService.generate(requestId);
    if (user.email) {
      await this.emailPublisher.publishOtpEmail(user.email, otp);
    }

    return {
      message: this.i18n.t('auth.password_verified_otp_sent'),
      requestId,
      channel: 'email',
      destination: user.email,
    };
  }

  async setPasswordConfirmOtp(userId: string, requestId: string, otp: string) {
    const storedUserId = await this.redisService.get(
      this.setPasswordKey(requestId),
    );
    if (!storedUserId || storedUserId !== userId) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.invalid_expired_request'),
        'BAD_REQUEST',
      );
    }

    await this.otpService.verify(requestId, otp);
    await this.redisService.del(this.setPasswordKey(requestId));

    const resetToken = randomUUID();
    await this.redisService.set(
      this.resetTokenKey(resetToken),
      userId,
      this.RESET_TOKEN_TTL,
    );

    return {
      message: this.i18n.t('auth.otp_verified_set_password'),
      resetToken,
    };
  }

  async setNewPassword(
    userId: string,
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.passwords_mismatch'),
        'BAD_REQUEST',
      );
    }

    const storedUserId = await this.redisService.get(
      this.resetTokenKey(resetToken),
    );
    if (!storedUserId || storedUserId !== userId) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.invalid_expired_token'),
        'BAD_REQUEST',
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(userId, { password: hashed });
    await this.redisService.del(this.resetTokenKey(resetToken));
    await this.jwtTokenService.revokeRefreshToken(userId);

    return { message: this.i18n.t('auth.password_updated') };
  }

  // ------------------------ Reset password (public) -----------------------

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      sendError(
        HttpStatus.NOT_FOUND,
        this.i18n.t('auth.no_account_found'),
        'NOT_FOUND',
      );
      return;
    }

    const requestId = randomUUID();
    await this.redisService.set(
      this.resetPasswordKey(requestId),
      user.id,
      this.PENDING_REG_TTL,
    );
    const otp = await this.otpService.generate(requestId);
    await this.emailPublisher.publishPasswordResetEmail(user.email, otp);

    return {
      message: this.i18n.t('auth.code_sent_email'),
      requestId,
      channel: 'email',
      destination: user.email,
    };
  }

  async forgotPasswordResendOtp(requestId: string) {
    const storedUserId = await this.redisService.get(
      this.resetPasswordKey(requestId),
    );
    if (!storedUserId) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.invalid_expired_request'),
        'BAD_REQUEST',
      );
      return;
    }

    const user = await this.usersService.findById(storedUserId);
    if (!user) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.invalid_expired_request'),
        'BAD_REQUEST',
      );
      return;
    }

    const otp = await this.otpService.generate(requestId);
    await this.emailPublisher.publishPasswordResetEmail(user.email, otp);

    return {
      message: this.i18n.t('auth.code_resent_email'),
      requestId,
      channel: 'email',
      destination: user.email,
    };
  }

  async forgotPasswordConfirmOtp(requestId: string, otp: string) {
    const storedUserId = await this.redisService.get(
      this.resetPasswordKey(requestId),
    );
    if (!storedUserId) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.invalid_expired_request'),
        'BAD_REQUEST',
      );
      return;
    }

    await this.otpService.verify(requestId, otp);
    await this.redisService.del(this.resetPasswordKey(requestId));

    const resetToken = randomUUID();
    await this.redisService.set(
      this.resetTokenKey(resetToken),
      storedUserId,
      this.RESET_TOKEN_TTL,
    );

    return {
      message: this.i18n.t('auth.otp_verified_set_password'),
      resetToken,
    };
  }

  async resetPassword(
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
    clientType: ClientType = 'mobile',
  ) {
    if (newPassword !== confirmPassword) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.passwords_mismatch'),
        'BAD_REQUEST',
      );
    }

    const storedUserId = await this.redisService.get(
      this.resetTokenKey(resetToken),
    );
    if (!storedUserId) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.invalid_expired_token'),
        'BAD_REQUEST',
      );
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await this.usersService.update(storedUserId, {
      password: hashed,
    });
    await this.redisService.del(this.resetTokenKey(resetToken));

    if (user.email) {
      this.emailPublisher
        .publishPasswordChangedEmail(user.email, user.fullName)
        .catch(() => undefined);
    }

    const tokens = await this.generateAndStoreTokens(user, clientType);
    return {
      message: this.i18n.t('auth.password_reset'),
      user: this.sanitize(user),
      ...tokens,
    };
  }

  // -------------------------------- Helpers -------------------------------

  private async loadPendingRegistration(
    requestId: string,
  ): Promise<PendingRegistration | null> {
    const data = await this.redisService.get(this.pendingRegKey(requestId));
    if (!data) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('auth.no_pending_registration'),
        'BAD_REQUEST',
      );
      return null;
    }
    return JSON.parse(data) as PendingRegistration;
  }

  private async generateAndStoreTokens(user: User, clientType: ClientType) {
    const tokens = await this.jwtTokenService.generateTokenPair(
      { sub: user.id, email: user.email, phone: user.phone, role: user.role },
      clientType,
    );
    await this.jwtTokenService.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  private sanitize(user: User) {
    const { password: _password, ...safe } = user;
    return safe;
  }

  private pendingRegKey(requestId: string): string {
    return `pending_reg:${requestId}`;
  }

  private setPasswordKey(requestId: string): string {
    return `set_password:${requestId}`;
  }

  private resetPasswordKey(requestId: string): string {
    return `reset_password:${requestId}`;
  }

  private resetTokenKey(token: string): string {
    return `reset_token:${token}`;
  }
}
