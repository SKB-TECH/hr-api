import { PartialType } from '@nestjs/swagger';
import { CreateJobDto } from './create-job.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '@prisma/client';

// PartialType automatically copies all fields from CreateJobDto and makes them optional!
export class UpdateJobDto extends PartialType(CreateJobDto) {
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus; // We explicitly add status so they can publish a DRAFT to LIVE
}