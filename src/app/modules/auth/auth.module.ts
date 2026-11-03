import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RegistrationController } from './registration.controller';
import { SetPasswordController } from './set-password.controller';
import { ResetPasswordController } from './reset-password.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { UsersModule } from '../users/users.module';
import { JwtTokenModule } from '@/libs/jwt/jwt-token.module';
import { OtpModule } from '@/libs/otp/otp.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthAccount } from '../users/entities/oauth-account.entity';
import { OidcAuthService } from './oidc-auth.service';

@Module({
  imports: [
    PassportModule,
    JwtTokenModule,
    UsersModule,
    OtpModule,
    TypeOrmModule.forFeature([OAuthAccount]),
  ],
  controllers: [
    AuthController,
    RegistrationController,
    SetPasswordController,
    ResetPasswordController,
  ],
  providers: [AuthService, OidcAuthService, JwtStrategy, JwtRefreshStrategy],
})
export class AuthModule {}
