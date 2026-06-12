import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus, AuthProvider } from '@/utils/enums';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { JwtTokenService } from '@/libs/jwt/jwt-token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type ClientType = 'web' | 'mobile';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async register(dto: RegisterDto, clientType: ClientType = 'mobile') {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      email: dto.email,
      password: hashed,
      fullName: dto.fullName,
      role: dto.role,
      status: UserStatus.active,
    });

    void this.auditLogService.log({
      userId: user.id,
      action: 'REGISTER',
      module: 'auth',
      newValues: { email: user.email, role: user.role },
    });

    const tokens = await this.generateAndStoreTokens(user, clientType);
    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDto, clientType: ClientType = 'mobile') {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password)
      throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

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
}
