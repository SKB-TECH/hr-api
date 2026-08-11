import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { JobRequirementType } from '../../../../utils/enums';
import { Job } from './job.entity';

@Entity({ name: 'job_requirements' })
export class JobRequirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, (job) => job.requirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'varchar' })
  type: JobRequirementType;

  @Column({ type: 'varchar' })
  value: string;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired: boolean;

  @Column({ name: 'is_hard_requirement', type: 'boolean', default: false })
  isHardRequirement: boolean;
}
