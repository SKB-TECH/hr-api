<<<<<<< HEAD
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/errors/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/files' });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
=======
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';
import { PrismaClientExceptionFilter } from './common/exceptions/prisma-client-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Security
  app.use(helmet());
  app.enableCors();
  app.use(compression());

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Filters
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new PrismaClientExceptionFilter(httpAdapter),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Infinity  Innovation - Job Listing API')
    .setDescription(' Job Listing Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
>>>>>>> a7948a2e2f81b2b8bfd274b5e9660dbde1d4ad91
}
bootstrap();
