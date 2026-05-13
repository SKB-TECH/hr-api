import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeroSection } from '../entities/hero-section.entity';
import { CeoSection } from '../entities/ceo-section.entity';
import { TeamMember } from '../entities/team-member.entity';
import { ContactSubmission } from '../entities/contact-submission.entity';

@Injectable()
export class AboutRepository {
  constructor(
    @InjectRepository(HeroSection)
    private readonly heroRepo: Repository<HeroSection>,

    @InjectRepository(CeoSection)
    private readonly ceoRepo: Repository<CeoSection>,

    @InjectRepository(TeamMember)
    private readonly teamRepo: Repository<TeamMember>,

    @InjectRepository(ContactSubmission)
    private readonly contactRepo: Repository<ContactSubmission>,
  ) {}

  // ── HERO ──────────────────────────────────────────────────────────────────

  findHero(): Promise<HeroSection> {
    return this.heroRepo.findOne({ where: {} });
  }

  async upsertHero(data: Partial<HeroSection>): Promise<HeroSection> {
    let hero = await this.heroRepo.findOne({ where: {} });
    if (!hero) {
      hero = this.heroRepo.create(data);
    } else {
      Object.assign(hero, data);
    }
    return this.heroRepo.save(hero);
  }

  // ── CEO ───────────────────────────────────────────────────────────────────

  findCeo(): Promise<CeoSection> {
    return this.ceoRepo.findOne({ where: {} });
  }

  async upsertCeo(data: Partial<CeoSection>): Promise<CeoSection> {
    let ceo = await this.ceoRepo.findOne({ where: {} });
    if (!ceo) {
      ceo = this.ceoRepo.create(data);
    } else {
      Object.assign(ceo, data);
    }
    return this.ceoRepo.save(ceo);
  }

  // ── TEAM ──────────────────────────────────────────────────────────────────

  findAllTeam(): Promise<TeamMember[]> {
    return this.teamRepo.find({ order: { order: 'ASC' } });
  }

  async findTeamMemberById(id: string): Promise<TeamMember> {
    const member = await this.teamRepo.findOne({ where: { id } });
    if (!member) throw new NotFoundException(`Team member ${id} not found`);
    return member;
  }

  createTeamMember(data: Partial<TeamMember>): Promise<TeamMember> {
    return this.teamRepo.save(this.teamRepo.create(data));
  }

  async updateTeamMember(id: string, data: Partial<TeamMember>): Promise<TeamMember> {
    await this.findTeamMemberById(id);
    await this.teamRepo.update(id, data);
    return this.teamRepo.findOne({ where: { id } });
  }

  async deleteTeamMember(id: string): Promise<void> {
    await this.findTeamMemberById(id);
    await this.teamRepo.delete(id);
  }

  // ── CONTACT ───────────────────────────────────────────────────────────────

  saveContact(data: Partial<ContactSubmission>): Promise<ContactSubmission> {
    return this.contactRepo.save(this.contactRepo.create(data));
  }
}
