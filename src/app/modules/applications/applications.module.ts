import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';
import { ApplicationStageHistory } from './entities/application-stage-history.entity';
import { Job } from '../jobs/entities/job.entity';
import { PipelineStage } from '../pipeline-stages/entities/pipeline-stage.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      ApplicationStageHistory,
      Job,
      PipelineStage,
      CompanyMember,
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
