import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './message.entity';

@Entity({ name: 'conversations' })
@Unique(['companyId', 'candidateId'])
export class Conversation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'company_id', type: 'uuid' }) companyId: string;
  @ManyToOne(() => Company, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'company_id' }) company: Company;
  @Index() @Column({ name: 'candidate_id', type: 'uuid' }) candidateId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'candidate_id' }) candidate: User;
  @OneToMany(() => ChatMessage, (message) => message.conversation) messages: ChatMessage[];
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
