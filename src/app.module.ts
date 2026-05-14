import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContactModule } from './contact/contact.module';
import { JobsModule } from './jobs/jobs.module';

@Module({
  imports: [ContactModule, JobsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
