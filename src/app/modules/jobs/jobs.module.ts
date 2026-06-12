import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { JobSkill } from './entities/job-skill.entity';
import { JobBenefit } from './entities/job-benefit.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobSkill, JobBenefit, CompanyMember]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
