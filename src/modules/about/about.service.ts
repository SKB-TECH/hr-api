import { Injectable, NotFoundException } from '@nestjs/common';
import { AboutRepository } from './repositories/about.repository';
import { UpdateHeroDto } from './dto/hero.dto';
import { UpdateCeoDto } from './dto/ceo.dto';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto';
import { CreateContactDto } from './dto/contact-form.dto';
import { HeroSection } from './entities/hero-section.entity';
import { CeoSection } from './entities/ceo-section.entity';
import { TeamMember } from './entities/team-member.entity';
import { ContactSubmission } from './entities/contact-submission.entity';

@Injectable()
export class AboutService {
  constructor(private readonly aboutRepository: AboutRepository) {}

  // ── HERO ──────────────────────────────────────────────────────────────────

  async getHero(): Promise<HeroSection> {
    const hero = await this.aboutRepository.findHero();
    if (!hero) throw new NotFoundException('Hero content not found');
    return hero;
  }

  updateHero(dto: UpdateHeroDto): Promise<HeroSection> {
    return this.aboutRepository.upsertHero(dto);
  }

  // ── CEO ───────────────────────────────────────────────────────────────────

  async getCeo(): Promise<CeoSection> {
    const ceo = await this.aboutRepository.findCeo();
    if (!ceo) throw new NotFoundException('CEO content not found');
    return ceo;
  }

  updateCeo(dto: UpdateCeoDto): Promise<CeoSection> {
    return this.aboutRepository.upsertCeo(dto);
  }

  // ── TEAM ──────────────────────────────────────────────────────────────────

  getTeam(): Promise<TeamMember[]> {
    return this.aboutRepository.findAllTeam();
  }

  createTeamMember(dto: CreateTeamMemberDto): Promise<TeamMember> {
    return this.aboutRepository.createTeamMember(dto);
  }

  updateTeamMember(id: string, dto: UpdateTeamMemberDto): Promise<TeamMember> {
    return this.aboutRepository.updateTeamMember(id, dto);
  }

  deleteTeamMember(id: string): Promise<void> {
    return this.aboutRepository.deleteTeamMember(id);
  }

  // ── CONTACT ───────────────────────────────────────────────────────────────

  submitContact(dto: CreateContactDto): Promise<ContactSubmission> {
    return this.aboutRepository.saveContact(dto);
  }
}
