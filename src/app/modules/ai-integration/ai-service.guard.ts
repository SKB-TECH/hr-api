import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { ConfigService } from '@/libs/env/config.service';

@Injectable()
export class AiServiceGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const supplied = context.switchToHttp().getRequest().headers[
      'x-service-token'
    ];
    const left = Buffer.from(typeof supplied === 'string' ? supplied : '');
    const current = this.config.get('HR_AI_SERVICE_TOKEN_CURRENT');
    const configured = (
      current
        ? [current, this.config.get('HR_AI_SERVICE_TOKEN_PREVIOUS')]
        : [this.config.get('HR_AI_SERVICE_TOKEN')]
    ).filter(
      (value, index, all) =>
        value && value.length >= 32 && all.indexOf(value) === index,
    );
    const valid = configured.some((value) => {
      const right = Buffer.from(value);
      return left.length === right.length && timingSafeEqual(left, right);
    });
    if (!valid)
      throw new UnauthorizedException('Invalid AI service credentials');
    return true;
  }
}
