import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const portal = context.switchToHttp().getRequest().query.portal;
    return portal === 'COMPANY' || portal === 'CANDIDATE'
      ? { state: portal }
      : undefined;
  }
}
