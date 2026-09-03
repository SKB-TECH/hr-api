import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';
import { Conversation } from './conversation.entity';

@Entity({ name: 'messages' })
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'conversation_id', type: 'uuid' }) conversationId: string;
  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'conversation_id' }) conversation: Conversation;
  @Index() @Column({ name: 'sender_id', type: 'uuid' }) senderId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'sender_id' }) sender: User;
  @Column({ type: 'text' }) text: string;
  @Column({ type: 'varchar', default: 'TEXT' }) type: 'TEXT' | 'JOB_PROPOSAL';
  @Column({ name: 'job_id', type: 'uuid', nullable: true }) jobId: string | null;
  @ManyToOne(() => Job, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'job_id' }) job: Job | null;
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true }) readAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
