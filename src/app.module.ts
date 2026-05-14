import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { CloudinaryModule } from './infrastructure/cloudinary/cloudinary.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { HeroModule } from './modules/hero/hero.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    PrismaModule,
    CloudinaryModule,
    JobsModule,
    HeroModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
