import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { DecimalTransformer } from '../../../../utils/transformers/decimal.transformer';
import { Job } from '../../jobs/entities/job.entity';
import { User } from '../../users/entities/user.entity';
import { Resume } from '../../candidate/candidate-resume/entities/resume.entity';
import { PipelineStage } from '../../pipeline-stages/entities/pipeline-stage.entity';
import { Interview } from '../../interviews/entities/interview.entity';
import { ApplicationStageHistory } from './application-stage-history.entity';

@Entity({ name: 'applications' })
@Unique(['jobId', 'candidateId'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, (job) => job.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Index()
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => User, (user) => user.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: User;

  @Column({ name: 'resume_id', type: 'uuid', nullable: true })
  resumeId: string | null;

  @ManyToOne(() => Resume, (resume) => resume.applications, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'resume_id' })
  resume: Resume | null;

  @Index()
  @Column({ name: 'stage_id', type: 'uuid', nullable: true })
  stageId: string | null;

  @ManyToOne(() => PipelineStage, (stage) => stage.applications, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'stage_id' })
  stage: PipelineStage | null;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ name: 'current_job_title', type: 'varchar', nullable: true })
  currentJobTitle: string | null;

  @Column({ name: 'linkedin_url', type: 'varchar', nullable: true })
  linkedinUrl: string | null;

  @Column({ name: 'portfolio_url', type: 'varchar', nullable: true })
  portfolioUrl: string | null;

  @Column({ name: 'cover_letter', type: 'text', nullable: true })
  coverLetter: string | null;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    transformer: DecimalTransformer,
  })
  score: number | null;

  @Column({
    name: 'applied_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  appliedAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Interview, (interview) => interview.application)
  interviews: Interview[];

  @OneToMany(() => ApplicationStageHistory, (history) => history.application)
  stageHistory: ApplicationStageHistory[];
}
