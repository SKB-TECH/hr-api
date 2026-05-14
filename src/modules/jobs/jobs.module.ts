import { Module } from '@nestjs/common';
import { JobsService } from './services/jobs.service';
import { JobsController } from './controllers/jobs.controller';
import { JobsRepository } from './repositories/jobs.repository';

@Module({
  controllers: [JobsController],
  providers: [JobsService, JobsRepository],
})
export class JobsModule {}
