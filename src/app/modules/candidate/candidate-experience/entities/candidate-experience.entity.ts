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
import { EmploymentType } from '../../../../../utils/enums';
import { CandidateProfile } from '../../candidate-profile/entities/candidate-profile.entity';

@Entity({ name: 'candidate_experiences' })
export class CandidateExperience {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(
    () => CandidateProfile,
    (candidate) => candidate.candidateExperiences,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateProfile;

  @Column({ name: 'company_name', type: 'varchar' })
  companyName: string;

  @Column({ type: 'varchar' })
  position: string;

  @Column({ name: 'employment_type', type: 'enum', enum: EmploymentType })
  employmentType: EmploymentType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ name: 'is_current', type: 'boolean', default: false })
  isCurrent: boolean;

  @Column({ name: 'country_name', type: 'varchar', nullable: true })
  countryName: string | null;

  @Column({ name: 'city_name', type: 'varchar', nullable: true })
  cityName: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
