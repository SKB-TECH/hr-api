import { UnauthorizedException } from '@nestjs/common';
import { AiServiceGuard } from './ai-service.guard';

describe('AiServiceGuard', () => {
  const context = (token?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-service-token': token } }),
      }),
    }) as any;
  it('accepts the configured service token', () => {
    const guard = new AiServiceGuard({ get: () => 'a'.repeat(32) } as any);
    expect(guard.canActivate(context('a'.repeat(32)))).toBe(true);
  });
  it('rejects missing or mismatched credentials', () => {
    const guard = new AiServiceGuard({ get: () => 'a'.repeat(32) } as any);
    expect(() => guard.canActivate(context('b'.repeat(32)))).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts current and previous tokens during rotation', () => {
    const guard = new AiServiceGuard({
      get: (key: string) =>
        key === 'HR_AI_SERVICE_TOKEN_CURRENT'
          ? 'c'.repeat(32)
          : key === 'HR_AI_SERVICE_TOKEN_PREVIOUS'
            ? 'p'.repeat(32)
            : undefined,
    } as any);
    expect(guard.canActivate(context('c'.repeat(32)))).toBe(true);
    expect(guard.canActivate(context('p'.repeat(32)))).toBe(true);
  });

  it('stops accepting the legacy token once CURRENT is configured', () => {
    const guard = new AiServiceGuard({
      get: (key: string) =>
        key === 'HR_AI_SERVICE_TOKEN_CURRENT'
          ? 'c'.repeat(32)
          : key === 'HR_AI_SERVICE_TOKEN'
            ? 'l'.repeat(32)
            : undefined,
    } as any);
    expect(() => guard.canActivate(context('l'.repeat(32)))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects insecure short configured tokens', () => {
    const guard = new AiServiceGuard({ get: () => 'short' } as any);
    expect(() => guard.canActivate(context('short'))).toThrow(
      UnauthorizedException,
    );
  });
});
