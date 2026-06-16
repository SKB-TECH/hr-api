import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { isWebClient, setTokenCookies } from './helpers/cookie.helper';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Auth / Registration')
@Controller('auth/registration')
export class RegistrationController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Step 1: Register and receive an email OTP' })
  @ApiResponse({ status: 201, description: 'OTP sent; requestId returned' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return sendResult(HttpStatus.CREATED, 'Verification code sent', data);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Step 2: Verify the OTP and receive tokens' })
  @ApiResponse({ status: 200, description: 'Verified; tokens issued' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: VerifyOtpDto,
  ) {
    const clientType = isWebClient(req) ? 'web' : 'mobile';
    const result = await this.authService.verifyOtp(dto, clientType);
    if (clientType === 'web' && result) {
      const { accessToken, refreshToken, ...rest } = result;
      setTokenCookies(res, { accessToken, refreshToken });
      return sendResult(HttpStatus.OK, 'Verified', rest);
    }
    return sendResult(HttpStatus.OK, 'Verified', result);
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 2 } })
  @ApiOperation({ summary: 'Resend the registration OTP' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    const data = await this.authService.resendOtp(dto.requestId);
    return sendResult(HttpStatus.OK, 'Verification code resent', data);
  }

  @Post('setup-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @ApiOperation({
    summary: 'Step 3: Set the password (Bearer token from verify-otp)',
  })
  @ApiResponse({ status: 200, description: 'Registration complete' })
  @ApiResponse({ status: 409, description: 'Password already set' })
  async setupPassword(
    @CurrentUser() user: { id: string },
    @Body() dto: SetupPasswordDto,
  ) {
    const data = await this.authService.setupPassword(user.id, dto);
    return sendResult(HttpStatus.OK, 'Registration complete', data);
  }
}
