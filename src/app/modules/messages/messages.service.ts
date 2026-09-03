import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { ConfigService } from '@/libs/env/config.service';
import { CompanyMember } from '../companies/entities/company-member.entity';
import { User } from '../users/entities/user.entity';
import { Job } from '../jobs/entities/job.entity';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/message.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(ChatMessage) private readonly messages: Repository<ChatMessage>,
    @InjectRepository(CompanyMember) private readonly members: Repository<CompanyMember>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Job) private readonly jobs: Repository<Job>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async list(user: { id: string; activeProfile?: string }) {
    const companyId = user.activeProfile === 'COMPANY' ? await this.companyIdFor(user.id) : null;
    const qb = this.conversations.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.company', 'company')
      .leftJoinAndSelect('conversation.candidate', 'candidate')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .leftJoinAndSelect('messages.sender', 'sender')
      .leftJoinAndSelect('messages.job', 'job')
      .orderBy('conversation.updatedAt', 'DESC').addOrderBy('messages.createdAt', 'ASC');
    companyId ? qb.where('conversation.companyId = :companyId', { companyId }) : qb.where('conversation.candidateId = :candidateId', { candidateId: user.id });
    return qb.getMany();
  }

  async create(dto: CreateConversationDto, userId: string) {
    const companyId = await this.companyIdFor(userId);
    if (!(await this.users.findOne({ where: { id: dto.candidateId } }))) throw new NotFoundException('Candidate not found');
    let conversation = await this.conversations.findOne({ where: { companyId, candidateId: dto.candidateId } });
    if (!conversation) conversation = await this.conversations.save(this.conversations.create({ companyId, candidateId: dto.candidateId }));
    const alreadyProposed = dto.jobId ? await this.messages.exist({ where: { conversationId: conversation.id, jobId: dto.jobId, type: 'JOB_PROPOSAL' } }) : false;
    if ((dto.jobId || dto.text) && !alreadyProposed) await this.send(conversation.id, { text: dto.text || 'Nous souhaitons vous proposer cette offre.', type: dto.jobId ? 'JOB_PROPOSAL' : 'TEXT', jobId: dto.jobId }, userId);
    return this.getOne(conversation.id, userId);
  }

  async getOne(id: string, userId: string) {
    await this.assertAccess(id, userId);
    const value = await this.conversations.findOne({ where: { id }, relations: { company: true, candidate: true, messages: { sender: true, job: true } }, order: { messages: { createdAt: 'ASC' } } });
    if (!value) throw new NotFoundException('Conversation not found');
    return value;
  }

  async send(conversationId: string, dto: SendMessageDto, senderId: string) {
    const conversation = await this.assertAccess(conversationId, senderId);
    if (dto.type === 'JOB_PROPOSAL' || dto.jobId) {
      const member = await this.members.findOne({ where: { companyId: conversation.companyId, userId: senderId } });
      if (!member) throw new ForbiddenException('Only the company can propose a job');
      const job = await this.jobs.findOne({ where: { id: dto.jobId, companyId: conversation.companyId } });
      if (!job) throw new NotFoundException('Company job not found');
    }
    const saved = await this.messages.save(this.messages.create({ conversationId, senderId, text: dto.text.trim(), type: dto.jobId ? 'JOB_PROPOSAL' : dto.type || 'TEXT', jobId: dto.jobId || null }));
    await this.conversations.update(conversationId, { updatedAt: new Date() });
    return this.messages.findOne({ where: { id: saved.id }, relations: { sender: true, job: true } });
  }

  async markRead(conversationId: string, userId: string) {
    await this.assertAccess(conversationId, userId);
    await this.messages.createQueryBuilder().update().set({ readAt: new Date() }).where('conversation_id = :conversationId', { conversationId }).andWhere('sender_id != :userId', { userId }).andWhere('read_at IS NULL').execute();
    return { success: true };
  }

  issueSocketToken(user: { id: string; activeProfile?: string }) { return this.jwt.sign({ sub: user.id, activeProfile: user.activeProfile, purpose: 'messages' }, { secret: this.secret(), expiresIn: '5m' }); }
  verifySocketToken(token: string) { const payload = this.jwt.verify<{ sub: string; activeProfile?: string; purpose: string }>(token, { secret: this.secret() }); if (payload.purpose !== 'messages') throw new Error('Invalid socket token'); return { id: payload.sub, activeProfile: payload.activeProfile }; }
  async canAccess(conversationId: string, userId: string) { await this.assertAccess(conversationId, userId); return true; }
  async participantUserIds(conversationId: string) { const conversation = await this.conversations.findOne({ where: { id: conversationId } }); if (!conversation) return []; const members = await this.members.find({ where: { companyId: conversation.companyId } }); return [conversation.candidateId, ...members.map((member) => member.userId)]; }

  private secret() { return this.config.get('JWT_SECRET_CURRENT') || this.config.get('JWT_SECRET'); }
  private async companyIdFor(userId: string) { const member = await this.members.findOne({ where: { userId, isActive: true } }) || await this.members.findOne({ where: { userId } }); if (!member) throw new ForbiddenException('Active company membership required'); return member.companyId; }
  private async assertAccess(id: string, userId: string) { const conversation = await this.conversations.findOne({ where: { id } }); if (!conversation) throw new NotFoundException('Conversation not found'); if (conversation.candidateId === userId) return conversation; const member = await this.members.findOne({ where: { userId, companyId: conversation.companyId } }); if (!member) throw new ForbiddenException('Conversation access denied'); return conversation; }
}
