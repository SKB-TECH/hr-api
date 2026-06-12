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

@Entity({ name: 'candidate_certifications' })
export class CandidateCertification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(
    () => CandidateProfile,
    (candidate) => candidate.candidateCertifications,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateProfile;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'varchar' })
  organization: string;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @Column({ name: 'expiration_date', type: 'date', nullable: true })
  expirationDate: Date | null;

  @Column({ name: 'credential_id', type: 'varchar', nullable: true })
  credentialId: string | null;

  @Column({ name: 'credential_url', type: 'text', nullable: true })
  credentialUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
