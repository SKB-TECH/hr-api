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

@Entity({ name: 'candidate_educations' })
export class CandidateEducation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(
    () => CandidateProfile,
    (candidate) => candidate.candidate_educations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateProfile;

  @Column({ name: 'school_name', type: 'varchar' })
  schoolName: string;

  @Column({ type: 'varchar' })
  degree: string;

  @Column({ name: 'field_of_study', type: 'varchar' })
  fieldOfStudy: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  grade: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
