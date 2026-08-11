import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'ai_profile_suggestions' })
export class AiProfileSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'candidate_profile_id', type: 'uuid' })
  candidateProfileId: string;

  @Column({ name: 'resume_id', type: 'uuid', unique: true })
  resumeId: string;

  @Column({ type: 'jsonb' })
  proposal: Record<string, unknown>;

  @Column({ type: 'varchar', default: 'pending_review' })
  status: 'pending_review' | 'dismissed';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
