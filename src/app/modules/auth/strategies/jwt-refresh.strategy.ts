import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '../../../../libs/env/config.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { getKid } from '../../../../libs/jwt/jwt-token.service';

function extractRefreshJwt(req: Request): string | null {
  return (
    req.cookies?.refresh_token ||
    (req.headers['x-refresh-token'] as string) ||
    null
  );
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    const currentSecret =
      configService.get('JWT_REFRESH_SECRET_CURRENT') ||
      configService.get('JWT_REFRESH_SECRET');
    const previousSecret = configService.get('JWT_REFRESH_SECRET_PREVIOUS');

    super({
      jwtFromRequest: extractRefreshJwt,
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKeyProvider: (
        _request: any,
        rawJwt: string,
        done: (err: any, secret?: string) => void,
      ) => {
        try {
          const header = JSON.parse(
            Buffer.from(rawJwt.split('.')[0], 'base64url').toString(),
          );
          const kid = header.kid;
          if (previousSecret && kid === getKid(previousSecret)) {
            return done(null, previousSecret);
          }
          return done(null, currentSecret);
        } catch {
          return done(null, currentSecret);
        }
      },
    });
  }

  validate(req: Request, payload: JwtPayload) {
    const refreshToken = extractRefreshJwt(req);
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      profiles: payload.profiles,
      activeProfile: payload.activeProfile,
      refreshToken,
    };
  }
}
