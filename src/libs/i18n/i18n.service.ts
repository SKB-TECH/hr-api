import { Injectable, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { langStore } from './i18n.context';

const FALLBACK_LANG = 'en';

@Injectable()
export class I18nService implements OnModuleInit {
  private translations: Record<string, Record<string, string>> = {};
  private supportedLangs: string[] = [FALLBACK_LANG];
  private defaultLang: string = FALLBACK_LANG;

  onModuleInit() {
    this.load();
  }

  private load() {
    const dir = path.join(__dirname, 'translations');
    if (!fs.existsSync(dir)) {
      this.translations = {};
      return;
    }

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
    this.translations = {};
    for (const file of files) {
      const lang = path.basename(file, '.json');
      this.translations[lang] = JSON.parse(
        fs.readFileSync(path.join(dir, file), 'utf-8'),
      );
    }

    this.supportedLangs = Object.keys(this.translations);
    if (!this.supportedLangs.includes(FALLBACK_LANG)) {
      this.supportedLangs.push(FALLBACK_LANG);
    }
  }

  getSupportedLangs(): string[] {
    return this.supportedLangs;
  }

  getDefaultLang(): string {
    return this.defaultLang;
  }

  t(key: string, params?: Record<string, string>): string {
    const lang = langStore.getStore() || this.defaultLang;
    return this.tLang(lang, key, params);
  }

  tLang(lang: string, key: string, params?: Record<string, string>): string {
    const translation =
      this.translations[lang]?.[key] ||
      this.translations[this.defaultLang]?.[key] ||
      this.translations[FALLBACK_LANG]?.[key] ||
      key;

    if (!params) return translation;

    return Object.entries(params).reduce(
      (result, [k, v]) =>
        result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v),
      translation,
    );
  }
}
