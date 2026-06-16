import { NestFactory } from '@nestjs/core';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';

import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './helpers/filters/global-exception.filter';
import { I18nService } from './libs/i18n/i18n.service';
import { ConfigService } from './libs/env/config.service';
import { findFirstConstraint } from './helpers/message/find-first-constraint';
import { sendError } from './helpers/message/sendResult';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  app.set('trust proxy', 1);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'x-client-type',
      'x-refresh-token',
      'x-reset-token',
      'x-language-code',
    ],
  });
  app.use(compression());
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/files' });

  const i18nService = app.get(I18nService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const first = findFirstConstraint(errors);
        if (!first) {
          return sendError(
            HttpStatus.BAD_REQUEST,
            i18nService.t('validation.invalid'),
            'BAD_REQUEST',
          );
        }
        const i18nKey = `validation.${first.key}`;
        const translated = i18nService.t(i18nKey, { property: first.property });
        if (translated !== i18nKey) {
          return sendError(HttpStatus.BAD_REQUEST, translated, 'BAD_REQUEST');
        }
        const translatedFallback = i18nService.t(first.fallback, {
          property: first.property,
        });
        return sendError(
          HttpStatus.BAD_REQUEST,
          translatedFallback,
          'BAD_REQUEST',
        );
      },
      stopAtFirstError: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter(i18nService));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('HR API')
    .setDescription('Recruitment Platform Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const configService = new ConfigService();
  const APP_PORT = parseInt(configService.get('APP_PORT') ?? '3000', 10);
  await app.listen(APP_PORT);
  app.get(Logger).log(`Server running on http://localhost:${APP_PORT}/api/v1`);
  app.get(Logger).log(`Swagger docs at http://localhost:${APP_PORT}/api/docs`);
}
void bootstrap();
