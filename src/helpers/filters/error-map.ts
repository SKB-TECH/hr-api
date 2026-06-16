import { HttpStatus } from '@nestjs/common';

/**
 * Maps HTTP statuses to a stable error code + i18n message key.
 * `forceTranslate` statuses always use the translated key (ignoring the
 * exception's own message) so auth responses never leak internal detail.
 */
export const ERROR_MAP: Record<
  number,
  { error: string; key: string; forceTranslate?: boolean }
> = {
  [HttpStatus.UNAUTHORIZED]: {
    error: 'UNAUTHORIZED',
    key: 'auth.authentication_required',
    forceTranslate: true,
  },
  [HttpStatus.FORBIDDEN]: {
    error: 'FORBIDDEN',
    key: 'auth.permission_denied',
    forceTranslate: true,
  },
  [HttpStatus.NOT_FOUND]: { error: 'NOT_FOUND', key: 'common.not_found' },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    error: 'TOO_MANY_REQUESTS',
    key: 'common.too_many_requests',
  },
};
