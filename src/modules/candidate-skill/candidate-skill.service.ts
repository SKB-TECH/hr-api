import { Injectable, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { AddCandidateSkillDto } from './dto/create-candidate-skill.dto';
import { Prisma } from '@prisma/client';
import { CandidateSkillResponseDto } from './dto/candidate-skill-response.dto';

@Injectable()
export class CandidateSkillService {
  private readonly logger = new Logger(CandidateSkillService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to securely resolve Candidate ID through user session context
   */
  private async resolveCandidateOrThrow(userId: string): Promise<string> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      this.logger.warn(`Context Resolution Blocked: User identity ${userId} has not initialized a CandidateProfile record.`);
      throw new NotFoundException('Candidate profile structure missing. Please complete initial configuration onboarding.');
    }

    return profile.id;
  }

  /**
   * Links a technology reference to an active candidate portfolio context.
   */
  async addSkill(userId: string, dto: AddCandidateSkillDto): Promise<CandidateSkillResponseDto> {
    const candidateId = await this.resolveCandidateOrThrow(userId);

    // Validate global technology catalog presence
    const targetSkill = await this.prisma.skill.findUnique({
      where: { id: dto.skillId },
      select: { name: true },
    });

    if (!targetSkill) {
      throw new NotFoundException(`The requested skill reference with ID '${dto.skillId}' does not exist inside our catalogs.`);
    }

    try {
      const created = await this.prisma.candidateSkill.create({
        data: {
          candidateId,
          skillId: dto.skillId,
          level: dto.level,
          yearsExperience: dto.yearsExperience,
        },
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              slug: true,
              category: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      // Map to the response DTO shape (hide raw DB relations)
      const response: CandidateSkillResponseDto = {
        id: created.id,
        level: created.level,
        yearsExperience: created.yearsExperience,
        skill: {
          id: created.skill.id,
          name: created.skill.name,
          slug: created.skill.slug,
          category: created.skill.category
            ? { id: created.skill.category.id, name: created.skill.category.name }
            : null,
        },
      };

      return response;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle database uniqueness constraints cleanly (P2002)
        if (error.code === 'P2002') {
          this.logger.warn(`Idempotency protection hit: Candidate ${candidateId} tried to re-map existing skill ${dto.skillId}.`);
          throw new ConflictException(`The technology skill '${targetSkill.name}' is already attached to your candidate profile.`);
        }
      }

      this.logger.error(`Critical database persistence breakdown for candidate ${candidateId}:`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('An unexpected database failure occurred during technology linkage execution.');
    }
  }

  /**
   * Detaches a technology record from the candidate portfolio after verifying ownership bounds.
   */
  async removeSkill(userId: string, candidateSkillId: string): Promise<{ success: boolean; message: string }> {
    const candidateId = await this.resolveCandidateOrThrow(userId);

    const targetRelation = await this.prisma.candidateSkill.findUnique({
      where: { id: candidateSkillId },
      select: { candidateId: true },
    });

    if (!targetRelation) {
      throw new NotFoundException(`The skill association mapping with ID '${candidateSkillId}' does not exist.`);
    }

    // Tenant Isolation Enforcement Guard
    if (targetRelation.candidateId !== candidateId) {
      this.logger.error(`Security Alert: User context ${userId} attempted unauthorized mutation of cross-tenant relation ${candidateSkillId}.`);
      throw new ForbiddenException('Access denied. This skill mapping context belongs to another candidate profile portfolio.');
    }

    await this.prisma.candidateSkill.delete({
      where: { id: candidateSkillId },
    });

    return {
      success: true,
      message: 'Technology skill successfully detached from your candidate portfolio context.',
    };
  }

  
  async findAllByCandidate(candidateId: string): Promise<CandidateSkillResponseDto[]> {
    // Assert target profile structure exists prior to running relations sweeps
    const candidateExists = await this.prisma.candidateProfile.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!candidateExists) {
      throw new NotFoundException(`Candidate profile with identifier '${candidateId}' does not exist.`);
    }

    const results = await this.prisma.candidateSkill.findMany({
      where: { candidateId },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: {
        yearsExperience: 'desc', // Orders by domain mastery level automatically
      },
    });

    return results.map((r): CandidateSkillResponseDto => ({
      id: r.id,
      level: r.level,
      yearsExperience: r.yearsExperience,
      skill: r.skill
        ? {
            id: r.skill.id,
            name: r.skill.name,
            slug: r.skill.slug,
            category: r.skill.category ? { id: r.skill.category.id, name: r.skill.category.name } : null,
          }
        : null,
    }));
  }

 
  async findMySkills(userId: string): Promise<CandidateSkillResponseDto[]> {
    const candidateId = await this.resolveCandidateOrThrow(userId);

    const results = await this.prisma.candidateSkill.findMany({
      where: { candidateId },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: {
        yearsExperience: 'desc',
      },
    });

    return results.map((r): CandidateSkillResponseDto => ({
      id: r.id,
      level: r.level,
      yearsExperience: r.yearsExperience,
      skill: r.skill
        ? {
            id: r.skill.id,
            name: r.skill.name,
            slug: r.skill.slug,
            category: r.skill.category ? { id: r.skill.category.id, name: r.skill.category.name } : null,
          }
        : null,
    }));
  }
}