import { HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { I18nService } from '../i18n/i18n.service';
import { sendError } from '@/helpers/message/sendResult';

@Injectable()
export class OtpService {
  private readonly OTP_TTL = 600;

  constructor(
    private readonly redisService: RedisService,
    private readonly i18n: I18nService,
  ) {}

  async generate(requestId: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisService.set(this.otpKey(requestId), otp, this.OTP_TTL);
    return otp;
  }

  async verify(requestId: string, otp: string): Promise<void> {
    const stored = await this.redisService.get(this.otpKey(requestId));

    if (!stored) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('otp.expired'),
        'BAD_REQUEST',
      );
    }

    if (stored !== otp) {
      sendError(
        HttpStatus.BAD_REQUEST,
        this.i18n.t('otp.invalid'),
        'BAD_REQUEST',
      );
    }

    await this.redisService.del(this.otpKey(requestId));
  }

  private otpKey(requestId: string): string {
    return `otp:${requestId}`;
  }
}
