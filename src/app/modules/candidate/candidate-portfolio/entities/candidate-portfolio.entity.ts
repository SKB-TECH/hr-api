import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CandidateProfile } from '../../candidate-profile/entities/candidate-profile.entity';

@Entity({ name: 'candidate_portfolios' })
export class CandidatePortfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(
    () => CandidateProfile,
    (candidate) => candidate.candidatePortfolios,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateProfile;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar' })
  thumbnailUrl: string;

  @Column({ name: 'project_url', type: 'varchar', nullable: true })
  projectUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
