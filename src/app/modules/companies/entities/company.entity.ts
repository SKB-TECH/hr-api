import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyMember } from './company-member.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Interview } from '../../interviews/entities/interview.entity';
import { PipelineStage } from '../../pipeline-stages/entities/pipeline-stage.entity';
import { CompanyTeamMember } from './company-team-member.entity';

@Entity({ name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  slug: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true })
  industry: string | null;

  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  locations: string[];

  @Column({ name: 'foundation_date', type: 'timestamptz', nullable: true })
  foundationDate: Date | null;

  @Column({ name: 'company_size', type: 'varchar', nullable: true })
  companySize: string | null;

  @Column({ type: 'varchar', nullable: true })
  logo: string | null;

  @Column({ name: 'cover_image', type: 'varchar', nullable: true })
  coverImage: string | null;

  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @Column({ type: 'varchar', nullable: true })
  facebook: string | null;

  @Column({ type: 'varchar', nullable: true })
  twitter: string | null;

  @Column({ type: 'varchar', nullable: true })
  instagram: string | null;

  @Column({ type: 'varchar', nullable: true })
  linkedin: string | null;

  @Column({ type: 'varchar', nullable: true })
  youtube: string | null;

  @Column({ name: 'tech_stack', type: 'jsonb', default: () => "'[]'::jsonb" })
  techStack: string[];

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  perks: Array<{ title: string; description: string; icon?: string }>;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  gallery: string[];

  @Column({ type: 'varchar', default: 'public' })
  visibility: 'public' | 'authenticated' | 'verified_candidates' | 'private';

  @Column({ name: 'email_contact_enabled', type: 'boolean', default: true })
  emailContactEnabled: boolean;

  @Column({ name: 'in_app_contact_enabled', type: 'boolean', default: true })
  inAppContactEnabled: boolean;

  @Column({ type: 'varchar', default: 'active' })
  status: 'active' | 'deactivated' | 'deletion_scheduled';

  @Column({ name: 'deactivation_reason', type: 'varchar', nullable: true })
  deactivationReason: string | null;

  @Column({
    name: 'deletion_scheduled_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletionScheduledAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => CompanyMember, (member) => member.company)
  members: CompanyMember[];

  @OneToMany(() => Job, (job) => job.company)
  jobs: Job[];

  @OneToMany(() => Interview, (interview) => interview.company)
  interviews: Interview[];

  @OneToMany(() => PipelineStage, (stage) => stage.company)
  pipelineStages: PipelineStage[];

  @OneToMany(() => CompanyTeamMember, (member) => member.company)
  teamMembers: CompanyTeamMember[];
}
