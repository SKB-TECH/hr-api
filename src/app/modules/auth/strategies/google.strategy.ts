import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { name, emails, photos } = profile;
    const email = emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException(
        'Google did not provide an email address for this account.',
      );
    }
    const user = {
      email,
      fullName:
        `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim() || email,
      avatar: photos?.[0]?.value ?? null,
    };
    done(null, user);
  }
}
