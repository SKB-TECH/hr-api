import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { ConfigService } from '../env/config.service';
import { RedisService } from '../redis/redis.service';
import { JwtPayload } from '../../app/modules/auth/interfaces/jwt-payload.interface';
import { parseExpirationToSeconds } from '../../helpers/time/parse-expiration';

export function getKid(secret: string): string {
  return createHash('sha256').update(secret).digest('hex').slice(0, 8);
}

@Injectable()
export class JwtTokenService {
  private readonly refreshTtl: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.refreshTtl = parseExpirationToSeconds(
      this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
    );
  }

  private getAccessSecret(): string {
    return (
      this.configService.get('JWT_SECRET_CURRENT') ||
      this.configService.get('JWT_SECRET')
    );
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get('JWT_REFRESH_SECRET_CURRENT') ||
      this.configService.get('JWT_REFRESH_SECRET')
    );
  }

  async generateAccessToken(
    payload: JwtPayload,
    clientType: 'web' | 'mobile' = 'mobile',
  ): Promise<string> {
    const expiresIn =
      clientType === 'web'
        ? '24h'
        : this.configService.get('JWT_EXPIRATION') || '24h';

    const secret = this.getAccessSecret();
    return this.jwtService.signAsync(
      payload as any,
      {
        secret,
        expiresIn,
        keyid: getKid(secret),
      } as any,
    );
  }

  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    const secret = this.getRefreshSecret();
    return this.jwtService.signAsync(
      payload as any,
      {
        secret,
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION') || '7d',
        keyid: getKid(secret),
      } as any,
    );
  }

  async generateTokenPair(
    payload: JwtPayload,
    clientType: 'web' | 'mobile' = 'mobile',
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(payload, clientType),
      this.generateRefreshToken(payload),
    ]);
    return { accessToken, refreshToken };
  }

  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.redisService.set(
      this.refreshTokenKey(userId),
      hashed,
      this.refreshTtl,
    );
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const storedHash = await this.redisService.get(
      this.refreshTokenKey(userId),
    );
    if (!storedHash) return false;
    return bcrypt.compare(refreshToken, storedHash);
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    await this.redisService.del(this.refreshTokenKey(userId));
  }

  private refreshTokenKey(userId: string): string {
    return `refresh_token:${userId}`;
  }
}
