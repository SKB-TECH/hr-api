import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import helmet from 'helmet';
import * as compression from 'compression';

import { AppModule } from './app.module';

// Global configurations from Gilbert & Esther
import { GlobalExceptionFilter } from './common/exceptions/global-exception.filter';
import { PrismaClientExceptionFilter } from './common/exceptions/prisma-client-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  // 1. Tell NestJS we are using Express (required for Esther's image uploads)
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 2. Global Prefix (Gilbert's addition)
  app.setGlobalPrefix('api/v1');

  // 3. Security & Optimization (Gilbert's additions)
  app.use(helmet());
  app.enableCors();
  app.use(compression());

  // 4. Static Assets for Image Uploads (Esther's addition)
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/files' });

  // 5. Global Pipes for Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 6. Global Interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // 7. Global Exception Filters
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new GlobalExceptionFilter(), 
    new PrismaClientExceptionFilter(httpAdapter),
  );

  // 8. Swagger API Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Infinity Innovation - HR API')
    .setDescription('Recruitment & Job Listing Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 9. Start the server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();