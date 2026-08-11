import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EmploymentType,
  JobCategory,
  JobLevel,
  JobStatus,
} from '../../../../utils/enums';
import { DecimalTransformer } from '../../../../utils/transformers/decimal.transformer';
import { Company } from '../../companies/entities/company.entity';
import { JobSkill } from './job-skill.entity';
import { JobBenefit } from './job-benefit.entity';
import { Application } from '../../applications/entities/application.entity';
import { JobRequirement } from './job-requirement.entity';

@Entity({ name: 'jobs' })
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, (company) => company.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'varchar' })
  title: string;

  @Index()
  @Column({ name: 'employment_type', type: 'enum', enum: EmploymentType })
  employmentType: EmploymentType;

  @Column({
    name: 'employment_types',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  employmentTypes: EmploymentType[];

  @Index()
  @Column({ name: 'job_level', type: 'enum', enum: JobLevel })
  jobLevel: JobLevel;

  @Index()
  @Column({ type: 'enum', enum: JobCategory })
  category: JobCategory;

  @Column({ type: 'varchar' })
  location: string;

  @Column({
    name: 'salary_min',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: DecimalTransformer,
  })
  salaryMin: number | null;

  @Column({
    name: 'salary_max',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: DecimalTransformer,
  })
  salaryMax: number | null;

  @Column({ name: 'salary_currency', type: 'varchar', default: 'USD' })
  salaryCurrency: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  responsibilities: string;

  @Column({ name: 'who_you_are', type: 'text' })
  whoYouAre: string;

  @Column({ name: 'nice_to_haves', type: 'text', nullable: true })
  niceToHaves: string | null;

  @Column({ type: 'int', default: 10 })
  capacity: number;

  @Column({ name: 'applications_count', type: 'int', default: 0 })
  applicationsCount: number;

  @Index()
  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status: JobStatus;

  @Column({ name: 'apply_before', type: 'timestamptz', nullable: true })
  applyBefore: Date | null;

  @Column({ name: 'posted_at', type: 'timestamptz', nullable: true })
  postedAt: Date | null;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => JobSkill, (jobSkill) => jobSkill.job, { cascade: true })
  skills: JobSkill[];

  @OneToMany(() => JobBenefit, (benefit) => benefit.job, { cascade: true })
  benefits: JobBenefit[];

  @OneToMany(() => Application, (application) => application.job)
  applications: Application[];

  @OneToMany(() => JobRequirement, (requirement) => requirement.job, {
    cascade: true,
  })
  requirements: JobRequirement[];
}
