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
}
