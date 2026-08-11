import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from './company.entity';

@Entity({ name: 'company_invitations' })
export class CompanyInvitation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @Column({ type: 'varchar' }) email: string;
  @Column({ name: 'full_name', type: 'varchar', nullable: true })
  fullName: string | null;
  @Column({ type: 'varchar', nullable: true }) title: string | null;
  @Column({ type: 'varchar' }) role: 'HR_MANAGER' | 'RECRUITER';
  @Column({ name: 'token_hash', type: 'char', length: 64, unique: true })
  tokenHash: string;
  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  @Column({ name: 'invited_by', type: 'uuid' }) invitedBy: string;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
