import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SetPasswordOtpDto } from './dto/set-password-otp.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { isWebClient, setTokenCookies } from './helpers/cookie.helper';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Auth / Reset Password')
@Controller('auth/reset-password')
export class ResetPasswordController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Step 1: Request a password reset OTP by email' })
  @ApiResponse({ status: 200, description: 'OTP sent if the account exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const data = await this.authService.forgotPassword(dto.email);
    return sendResult(HttpStatus.OK, 'Verification code sent', data);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 2 } })
  @ApiOperation({ summary: 'Resend the password reset OTP' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    const data = await this.authService.forgotPasswordResendOtp(dto.requestId);
    return sendResult(HttpStatus.OK, 'Verification code resent', data);
  }

  @Post('confirm-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Step 2: Confirm OTP; returns a reset token' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified; resetToken returned',
  })
  async confirmOtp(@Body() dto: SetPasswordOtpDto) {
    const data = await this.authService.forgotPasswordConfirmOtp(
      dto.requestId,
      dto.otp,
    );
    return sendResult(HttpStatus.OK, 'OTP verified', data);
  }

  @Patch('set-new-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Step 3: Set the new password and log in' })
  @ApiHeader({
    name: 'x-reset-token',
    required: true,
    description: 'Reset token from confirm-otp',
  })
  @ApiResponse({ status: 200, description: 'Password reset; tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  async resetPassword(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-reset-token') resetToken: string,
    @Body() dto: NewPasswordDto,
  ) {
    const clientType = isWebClient(req) ? 'web' : 'mobile';
    const result = await this.authService.resetPassword(
      resetToken,
      dto.newPassword,
      dto.confirmPassword,
      clientType,
    );
    if (clientType === 'web' && result) {
      const { accessToken, refreshToken, ...rest } = result;
      setTokenCookies(res, { accessToken, refreshToken });
      return sendResult(HttpStatus.OK, 'Password reset', rest);
    }
    return sendResult(HttpStatus.OK, 'Password reset', result);
  }
}
