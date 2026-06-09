import { Module } from '@nestjs/common';
import { PipelineStagesService } from './pipeline-stages.service';
import { PipelineStagesController } from './pipeline-stages.controller';

@Module({
  controllers: [PipelineStagesController],
  providers: [PipelineStagesService],
})
export class PipelineStagesModule {}
