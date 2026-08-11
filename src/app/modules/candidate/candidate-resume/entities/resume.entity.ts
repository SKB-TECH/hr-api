import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CandidateProfile } from '../../candidate-profile/entities/candidate-profile.entity';
import { Application } from '../../../applications/entities/application.entity';
import { ResumeParsingStatus } from '../../../../../utils/enums';

@Entity({ name: 'resumes' })
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => CandidateProfile, (candidate) => candidate.resumes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateProfile;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ name: 'file_url', type: 'varchar' })
  fileUrl: string;

  @Column({ name: 'public_id', type: 'varchar' })
  publicId: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'boolean', default: false })
  parsed: boolean;

  @Column({
    name: 'parsing_status',
    type: 'varchar',
    default: ResumeParsingStatus.PENDING,
  })
  parsingStatus: ResumeParsingStatus;

  @Column({ name: 'parsing_error', type: 'varchar', nullable: true })
  parsingError: string | null;

  @Column({ name: 'parsed_at', type: 'timestamptz', nullable: true })
  parsedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Application, (application) => application.resume)
  applications: Application[];
}
