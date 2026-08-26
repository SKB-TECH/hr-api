import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  clearTokenCookies,
  isWebClient,
  setTokenCookies,
} from './helpers/cookie.helper';
import { sendResult } from '@/helpers/message/sendResult';
import { SwitchProfileDto } from './dto/switch-profile.dto';

@ApiTags('Auth')
@ApiHeader({
  name: 'x-client-type',
  required: false,
  description:
    '"web" (default) sets httpOnly cookies; "mobile" returns tokens in the body.',
})
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ) {
    const clientType = isWebClient(req) ? 'web' : 'mobile';
    const result = await this.authService.login(dto, clientType);
    return this.deliver(
      res,
      clientType,
      result,
      HttpStatus.OK,
      'Login successful',
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiHeader({
    name: 'x-refresh-token',
    required: false,
    description:
      'Refresh token for mobile clients (web clients use the cookie).',
  })
  @ApiOperation({ summary: 'Rotate tokens using a valid refresh token' })
  @ApiResponse({ status: 200, description: 'New token pair issued' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: { id: string; refreshToken: string },
  ) {
    const clientType = isWebClient(req) ? 'web' : 'mobile';
    const tokens = await this.authService.refresh(
      user.id,
      user.refreshToken,
      clientType,
    );
    if (clientType === 'web') {
      setTokenCookies(res, tokens);
      return sendResult(HttpStatus.OK, 'Tokens refreshed', null);
    }
    return sendResult(HttpStatus.OK, 'Tokens refreshed', tokens);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke the refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: { id: string },
  ) {
    await this.authService.logout(user.id);
    clearTokenCookies(res);
    return sendResult(HttpStatus.OK, 'Logged out successfully', null);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(
    @CurrentUser()
    user: {
      id: string;
      activeProfile?: 'CANDIDATE' | 'COMPANY';
    },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Current user',
      await this.authService.session(user.id, user.activeProfile),
    );
  }

  @Post('profiles')
  @UseGuards(JwtAuthGuard)
  async enableProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: SwitchProfileDto,
  ) {
    return sendResult(
      HttpStatus.OK,
      'Profile enabled',
      await this.authService.enableProfile(user.id, dto.profile),
    );
  }

  @Patch('active-profile')
  @UseGuards(JwtAuthGuard)
  async switchProfile(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: { id: string },
    @Body() dto: SwitchProfileDto,
  ) {
    const clientType = isWebClient(req) ? 'web' : 'mobile';
    const result = await this.authService.switchProfile(
      user.id,
      dto.profile,
      clientType,
    );
    if (clientType === 'web') {
      const { accessToken, refreshToken, user: sessionUser } = result;
      setTokenCookies(res, { accessToken, refreshToken });
      return sendResult(HttpStatus.OK, 'Active profile changed', sessionUser);
    }
    return sendResult(HttpStatus.OK, 'Active profile changed', result);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Redirect to Google login (Sign Up / Login with Google)',
  })
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — issues tokens' })
  @ApiResponse({ status: 200, description: 'Google login successful' })
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const clientType = isWebClient(req) ? 'web' : 'mobile';
    const { accessToken, refreshToken, ...rest } =
      await this.authService.googleLogin(req.user, clientType, req.query.state);
    if (clientType === 'web') {
      setTokenCookies(res, { accessToken, refreshToken });
      return res.json(
        await sendResult(HttpStatus.OK, 'Google login successful', rest),
      );
    }
    return res.json(
      await sendResult(HttpStatus.OK, 'Google login successful', {
        ...rest,
        accessToken,
        refreshToken,
      }),
    );
  }

  private deliver(
    res: Response,
    clientType: 'web' | 'mobile',
    result: { accessToken: string; refreshToken: string; user: any },
    status: number,
    message: string,
  ) {
    if (clientType === 'web') {
      const { accessToken, refreshToken, ...rest } = result;
      setTokenCookies(res, { accessToken, refreshToken });
      return sendResult(status, message, rest);
    }
    return sendResult(status, message, result);
  }
}
