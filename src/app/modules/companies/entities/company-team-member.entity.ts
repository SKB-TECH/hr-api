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

@Entity({ name: 'company_team_members' })
export class CompanyTeamMember {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ type: 'varchar', length: 150 }) role: string;
  @Column({ type: 'varchar', nullable: true }) avatar: string | null;
  @Column({ type: 'varchar', nullable: true }) instagram: string | null;
  @Column({ type: 'varchar', nullable: true }) linkedin: string | null;
  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => Company, (company) => company.teamMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
