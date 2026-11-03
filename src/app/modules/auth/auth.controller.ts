import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  Patch,
  Param,
  Query,
  Header,
  Logger,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
import { OidcAuthService } from './oidc-auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  clearTokenCookies,
  isWebClient,
  setTokenCookies,
} from './helpers/cookie.helper';
import { sendResult } from '@/helpers/message/sendResult';
import { SwitchProfileDto } from './dto/switch-profile.dto';
import { OAuthProvider } from '../users/entities/oauth-account.entity';
import { OAuthEmailDto, VerifyOAuthEmailDto } from './dto/oauth-email.dto';

@ApiTags('Auth')
@ApiHeader({
  name: 'x-client-type',
  required: false,
  description:
    '"web" (default) sets httpOnly cookies; "mobile" returns tokens in the body.',
})
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly oidcAuthService: OidcAuthService,
  ) {}

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
  @Throttle({
    short: { limit: 5, ttl: 10000 },
    medium: { limit: 20, ttl: 60000 },
  })
  @ApiOperation({
    summary: 'Redirect to Google login (Sign Up / Login with Google)',
  })
  async googleAuth(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    return this.beginOAuth(OAuthProvider.GOOGLE, query, res);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OIDC callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.finishOAuth(OAuthProvider.GOOGLE, req, res);
  }

  @Get('linkedin')
  @Throttle({
    short: { limit: 5, ttl: 10000 },
    medium: { limit: 20, ttl: 60000 },
  })
  @ApiOperation({ summary: 'Redirect to LinkedIn OIDC login' })
  async linkedinAuth(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    return this.beginOAuth(OAuthProvider.LINKEDIN, query, res);
  }

  @Get('linkedin/callback')
  @ApiOperation({ summary: 'LinkedIn OIDC callback' })
  async linkedinCallback(@Req() req: Request, @Res() res: Response) {
    return this.finishOAuth(OAuthProvider.LINKEDIN, req, res);
  }

  @Get('connected-accounts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async connectedAccounts(@CurrentUser() user: { id: string }) {
    return sendResult(
      HttpStatus.OK,
      'Connected accounts',
      await this.oidcAuthService.connectedAccounts(user.id),
    );
  }

  @Post('connected-accounts/:provider/link')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async linkConnectedAccount(
    @Req() req: Request,
    @Param('provider') provider: string,
    @Body() body: { locale?: string; returnTo?: string },
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    this.oidcAuthService.assertFrontendOrigin(req.headers.origin);
    const oauthProvider = this.parseProvider(provider);
    const start = await this.oidcAuthService.begin(oauthProvider, {
      mode: 'link',
      userId: user.id,
      locale: body?.locale,
      returnTo: body?.returnTo,
    });
    this.setOAuthStateCookie(res, oauthProvider, start.state);
    return sendResult(HttpStatus.OK, 'Continue provider linking', {
      authorizationUrl: start.authorizationUrl,
    });
  }

  @Delete('connected-accounts/:provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async unlinkConnectedAccount(
    @Req() req: Request,
    @Param('provider') provider: string,
    @CurrentUser() user: { id: string },
  ) {
    this.oidcAuthService.assertFrontendOrigin(req.headers.origin);
    return sendResult(
      HttpStatus.OK,
      'Connected account removed',
      await this.oidcAuthService.unlinkAccount(
        user.id,
        this.parseProvider(provider),
      ),
    );
  }

  @Post('oauth/email')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @Throttle({
    short: { limit: 5, ttl: 10000 },
    medium: { limit: 5, ttl: 60000 },
  })
  async requestOAuthEmailVerification(
    @Req() req: Request,
    @Body() dto: OAuthEmailDto,
  ) {
    this.oidcAuthService.assertFrontendOrigin(req.headers.origin);
    return sendResult(
      HttpStatus.OK,
      'Verification code sent',
      await this.oidcAuthService.requestEmailVerification(
        dto.ticket,
        dto.email,
      ),
    );
  }

  @Post('oauth/verify-email')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  @Throttle({
    short: { limit: 5, ttl: 10000 },
    medium: { limit: 5, ttl: 60000 },
  })
  async verifyOAuthEmail(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: VerifyOAuthEmailDto,
  ) {
    this.oidcAuthService.assertFrontendOrigin(req.headers.origin);
    const clientType = isWebClient(req) ? 'web' : 'mobile';
    const result = await this.oidcAuthService.verifyEmailAndCreateAccount(
      dto.ticket,
      dto.otp,
      clientType,
    );
    if (clientType === 'web') {
      setTokenCookies(res, result);
      return sendResult(HttpStatus.OK, 'Email verified', {
        redirectPath: result.redirectPath,
      });
    }
    return sendResult(HttpStatus.OK, 'Email verified', result);
  }

  private async beginOAuth(
    provider: OAuthProvider,
    query: Record<string, string>,
    res: Response,
  ) {
    try {
      const start = await this.oidcAuthService.begin(provider, {
        portal: query.portal,
        locale: query.locale,
        returnTo: query.returnTo,
      });
      this.setOAuthStateCookie(res, provider, start.state);
      return res.redirect(start.authorizationUrl);
    } catch (error) {
      this.logger.warn(
        {
          provider,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        },
        'OAuth authorization could not be started',
      );
      return res.redirect(
        this.oidcAuthService.fallbackErrorRedirect(
          query.locale ?? 'en',
          'oauth_unavailable',
          provider,
        ),
      );
    }
  }

  private async finishOAuth(
    provider: OAuthProvider,
    req: Request,
    res: Response,
  ) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    const cookieName = this.oauthStateCookieName(provider);
    const stateCookie = req.cookies?.[cookieName];
    res.clearCookie(cookieName, { path: '/' });

    try {
      const result = await this.oidcAuthService.callback(
        provider,
        req.query,
        stateCookie,
        isWebClient(req) ? 'web' : 'mobile',
      );
      if (result.kind === 'session') {
        setTokenCookies(res, result.tokens);
        if (isWebClient(req)) return res.redirect(result.redirectUrl);
        return res.json(
          sendResult(HttpStatus.OK, 'OAuth login successful', result.tokens),
        );
      }
      return res.redirect(result.redirectUrl);
    } catch (error) {
      const errorCode =
        error instanceof ConflictException
          ? 'oauth_account_exists'
          : error instanceof ForbiddenException
            ? 'oauth_profile_forbidden'
            : 'oauth_callback_failed';
      this.logger.warn(
        {
          provider,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        },
        'OAuth callback failed',
      );
      return res.redirect(
        this.oidcAuthService.fallbackErrorRedirect(
          req.cookies?.NEXT_LOCALE ?? 'en',
          errorCode,
          provider,
        ),
      );
    }
  }

  private parseProvider(value: string): OAuthProvider {
    if (value === OAuthProvider.GOOGLE || value === OAuthProvider.LINKEDIN) {
      return value;
    }
    throw new BadRequestException('Unsupported OAuth provider');
  }

  private setOAuthStateCookie(
    res: Response,
    provider: OAuthProvider,
    state: string,
  ) {
    res.cookie(this.oauthStateCookieName(provider), state, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'local',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60 * 1000,
    });
  }

  private oauthStateCookieName(provider: OAuthProvider): string {
    return `oauth_state_${provider}`;
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
