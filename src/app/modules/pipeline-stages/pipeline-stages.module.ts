import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PipelineStagesService } from './pipeline-stages.service';
import { PipelineStagesController } from './pipeline-stages.controller';
import { PipelineStage } from './entities/pipeline-stage.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PipelineStage, CompanyMember])],
  controllers: [PipelineStagesController],
  providers: [PipelineStagesService],
})
export class PipelineStagesModule {}
