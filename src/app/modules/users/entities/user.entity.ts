import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuthProvider, UserRole, UserStatus } from '../../../../utils/enums';
import { CandidateProfile } from '../../candidate/candidate-profile/entities/candidate-profile.entity';
import { CompanyMember } from '../../companies/entities/company-member.entity';
import { AuditLog } from '../../audit-logs/entities/audit-log.entity';
import { Application } from '../../applications/entities/application.entity';
import { ApplicationStageHistory } from '../../applications/entities/application-stage-history.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column({ name: 'full_name', type: 'varchar' })
  fullName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CANDIDATE })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.pending })
  status: UserStatus;

  @Column({ type: 'enum', enum: AuthProvider, default: AuthProvider.local })
  provider: AuthProvider;

  @Column({ type: 'varchar', nullable: true })
  avatar: string | null;

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', type: 'boolean', default: false })
  phoneVerified: boolean;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin: Date | null;

  @Column({ name: 'two_factor_enabled', type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToOne(() => CandidateProfile, (profile) => profile.user)
  candidateProfile: CandidateProfile;

  @OneToMany(() => CompanyMember, (member) => member.user)
  companyMemberships: CompanyMember[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs: AuditLog[];

  @OneToMany(() => Application, (application) => application.candidate)
  applications: Application[];

  @OneToMany(() => ApplicationStageHistory, (history) => history.changedBy)
  stageHistories: ApplicationStageHistory[];
}
