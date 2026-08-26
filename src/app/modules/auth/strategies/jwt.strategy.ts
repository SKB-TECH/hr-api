import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '../../../../libs/env/config.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { getKid } from '../../../../libs/jwt/jwt-token.service';

function extractJwt(req: Request): string | null {
  return (
    req.cookies?.access_token || ExtractJwt.fromAuthHeaderAsBearerToken()(req)
  );
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const currentSecret =
      configService.get('JWT_SECRET_CURRENT') ||
      configService.get('JWT_SECRET');
    const previousSecret = configService.get('JWT_SECRET_PREVIOUS');

    super({
      jwtFromRequest: extractJwt,
      ignoreExpiration: false,
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

  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      profiles: payload.profiles,
      activeProfile: payload.activeProfile,
    };
  }
}
