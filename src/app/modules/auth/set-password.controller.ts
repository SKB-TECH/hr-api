import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SetPasswordVerifyDto } from './dto/set-password-verify.dto';
import { SetPasswordOtpDto } from './dto/set-password-otp.dto';
import { NewPasswordDto } from './dto/new-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Auth / Set Password')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('auth/set-password')
export class SetPasswordController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  @ApiOperation({ summary: 'Step 1: Verify current password; sends an OTP' })
  @ApiResponse({ status: 200, description: 'OTP sent' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async verify(
    @CurrentUser() user: { id: string },
    @Body() dto: SetPasswordVerifyDto,
  ) {
    const data = await this.authService.setPasswordVerify(
      user.id,
      dto.currentPassword,
    );
    return sendResult(HttpStatus.OK, 'OTP sent', data);
  }

  @Post('confirm-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Step 2: Confirm OTP; returns a reset token' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified; resetToken returned',
  })
  async confirmOtp(
    @CurrentUser() user: { id: string },
    @Body() dto: SetPasswordOtpDto,
  ) {
    const data = await this.authService.setPasswordConfirmOtp(
      user.id,
      dto.requestId,
      dto.otp,
    );
    return sendResult(HttpStatus.OK, 'OTP verified', data);
  }

  @Patch()
  @ApiOperation({ summary: 'Step 3: Set the new password' })
  @ApiHeader({
    name: 'x-reset-token',
    required: true,
    description: 'Reset token from confirm-otp',
  })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Invalid or expired reset token' })
  async setPassword(
    @CurrentUser() user: { id: string },
    @Headers('x-reset-token') resetToken: string,
    @Body() dto: NewPasswordDto,
  ) {
    const data = await this.authService.setNewPassword(
      user.id,
      resetToken,
      dto.newPassword,
      dto.confirmPassword,
    );
    return sendResult(HttpStatus.OK, 'Password updated', data);
  }
}
