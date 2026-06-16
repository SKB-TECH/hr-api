import { Request, Response } from 'express';

export const REFRESH_PATH = '/api/v1/auth/refresh';

export function isWebClient(req: Request): boolean {
  return req.headers['x-client-type'] !== 'mobile';
}

export function setTokenCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  refreshPath: string = REFRESH_PATH,
) {
  const isProduction = process.env.NODE_ENV !== 'local';
  const commonOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('strict' as const) : ('lax' as const),
    path: '/',
  };
  res.cookie('access_token', tokens.accessToken, {
    ...commonOptions,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
  res.cookie('refresh_token', tokens.refreshToken, {
    ...commonOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: refreshPath,
  });
}

export function clearTokenCookies(
  res: Response,
  refreshPath: string = REFRESH_PATH,
) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: refreshPath });
}
