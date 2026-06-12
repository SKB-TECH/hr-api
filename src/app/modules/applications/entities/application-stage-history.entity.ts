import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Application } from './application.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'application_stage_history' })
export class ApplicationStageHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'application_id', type: 'uuid' })
  applicationId: string;

  @ManyToOne(() => Application, (application) => application.stageHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ name: 'old_stage_name', type: 'varchar' })
  oldStageName: string;

  @Column({ name: 'new_stage_name', type: 'varchar' })
  newStageName: string;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedById: string;

  @ManyToOne(() => User, (user) => user.stageHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'changed_by' })
  changedBy: User;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
