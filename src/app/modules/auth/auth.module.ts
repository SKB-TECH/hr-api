import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RegistrationController } from './registration.controller';
import { SetPasswordController } from './set-password.controller';
import { ResetPasswordController } from './reset-password.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { JwtTokenModule } from '@/libs/jwt/jwt-token.module';
import { OtpModule } from '@/libs/otp/otp.module';

@Module({
  imports: [PassportModule, JwtTokenModule, UsersModule, OtpModule],
  controllers: [
    AuthController,
    RegistrationController,
    SetPasswordController,
    ResetPasswordController,
  ],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy],
})
export class AuthModule {}
