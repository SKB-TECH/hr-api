import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { langStore } from './i18n.context';
import { I18nService } from './i18n.service';

@Injectable()
export class I18nMiddleware implements NestMiddleware {
  constructor(private readonly i18n: I18nService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const header = (req.headers['x-language-code'] as string)?.toLowerCase();
    const supported = this.i18n.getSupportedLangs();
    const lang =
      header && supported.includes(header)
        ? header
        : this.i18n.getDefaultLang();
    langStore.run(lang, () => next());
  }
}
