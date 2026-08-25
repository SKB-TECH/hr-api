import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'company_notification_preferences' })
@Unique(['companyId', 'userId'])
export class CompanyNotificationPreference {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId: string;
  @Column({ name: 'recruiter_related', default: true })
  recruiterRelated: boolean;
  @Column({ name: 'subscription_notifications', default: true })
  subscriptionNotifications: boolean;
  @Column({ name: 'billing_alerts', default: false }) billingAlerts: boolean;
  @Column({ name: 'security_updates', default: true }) securityUpdates: boolean;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
