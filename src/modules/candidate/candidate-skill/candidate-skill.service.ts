import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateCategoryDto, CreateSkillDto, AssignSkillDto } from './dto/skill-management.dto';
import { CategoryResponseDto, SkillResponseDto, CandidateSkillResponseDto } from './dto/skill-management-response.dto';

@Injectable()
export class SkillManagementService {
  constructor(private readonly prisma: PrismaService) {}

  // SKILL CATEGORY ACTIONS (ADMIN)

  async createCategory(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const existing = await this.prisma.skillCategory.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`Category with name '${dto.name}' already exists.`);
    }

    return this.prisma.skillCategory.create({
      data: { name: dto.name },
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const target = await this.prisma.skillCategory.findUnique({
      where: { id },
    });

    if (!target) {
      throw new NotFoundException(`Category record with ID "${id}" was not found.`);
    }

    await this.prisma.skillCategory.delete({
      where: { id },
    });
  }

  async findAllCategories(): Promise<CategoryResponseDto[]> {
    return this.prisma.skillCategory.findMany();
  }

  // GLOBAL SKILLS DIRECTORY ACTIONS (ADMIN)

  async createSkill(dto: CreateSkillDto): Promise<SkillResponseDto> {
    const categoryExists = await this.prisma.skillCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!categoryExists) {
      throw new NotFoundException(`Cannot add skill. SkillCategory ID "${dto.categoryId}" does not exist.`);
    }

    const generatedSlug = dto.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const uniqueCheck = await this.prisma.skill.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug: generatedSlug }],
      },
    });

    if (uniqueCheck) {
      throw new ConflictException('A skill with this name or slug already exists in the system.');
    }

    const newSkill = await this.prisma.skill.create({
      data: {
        name: dto.name,
        slug: generatedSlug,
        categoryId: dto.categoryId,
      },
      include: {
        category: true,
      },
    });

    return this.mapToSkillResponse(newSkill);
  }

  async findAllSkills(): Promise<SkillResponseDto[]> {
    const skills = await this.prisma.skill.findMany({
      include: {
        category: true,
      },
    });
    // Fixed: Using arrow function to keep 'this' safe
    return skills.map((item) => this.mapToSkillResponse(item));
  }

  // CANDIDATE PROFILE SKILL SETS ACTIONS (CANDIDATE SELF-SERVICE)

  async assignSkillToCandidate(userId: string, dto: AssignSkillDto): Promise<CandidateSkillResponseDto> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException(
        `Cannot assign skill. Candidate profile record for User ID "${userId}" does not exist.`
      );
    }

    const skillExists = await this.prisma.skill.findUnique({
      where: { id: dto.skillId },
    });

    if (!skillExists) {
      throw new NotFoundException('The requested skill does not exist in the master directory.');
    }

    const candidateSkillRow = await this.prisma.candidateSkill.upsert({
      where: {
        candidateId_skillId: {
          candidateId: profile.id,
          skillId: dto.skillId,
        },
      },
      update: {
        level: dto.level,
        yearsExperience: dto.yearsExperience,
      },
      create: {
        candidateId: profile.id,
        skillId: dto.skillId,
        level: dto.level,
        yearsExperience: dto.yearsExperience,
      },
      include: {
        skill: {
          include: {
            category: true,
          },
        },
      },
    });

    return this.mapToCandidateSkillResponse(candidateSkillRow);
  }

  async getCandidateSkills(userId: string): Promise<CandidateSkillResponseDto[]> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId: userId },
    });

    if (!profile) {
      return [];
    }

    const records = await this.prisma.candidateSkill.findMany({
      where: { candidateId: profile.id },
      include: {
        skill: {
          include: {
            category: true,
          },
        },
      },
    });
    // Fixed: Using arrow function to keep 'this' safe
    return records.map((node) => this.mapToCandidateSkillResponse(node));
  }

 async removeSkillFromCandidate(userId: string, candidateSkillId: string): Promise<void> {
    // 1. Find the candidate profile first
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException('Candidate profile record not found.');
    }

    // 2. Look for the exact bridge row using its own unique ID and make sure it belongs to this candidate
    const record = await this.prisma.candidateSkill.findFirst({
      where: { 
        id: candidateSkillId,
        candidateId: profile.id 
      },
    });

    if (!record) {
      throw new NotFoundException('This skill mapping assignment was not found on your profile.');
    }

    // 3. Delete the row cleanly
    await this.prisma.candidateSkill.delete({
      where: { id: record.id },
    });
  }

  // Pure data converters
  private mapToSkillResponse(item: any): SkillResponseDto {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      category: item.category ? { id: item.category.id, name: item.category.name } : null,
    };
  }

  private mapToCandidateSkillResponse(node: any): CandidateSkillResponseDto {
    return {
      id: node.id,
      candidateId: node.candidateId,
      level: node.level,
      yearsExperience: node.yearsExperience,
      skill: this.mapToSkillResponse(node.skill),
    };
  }

  async getSkillsByCandidateProfileId(candidateId: string): Promise<CandidateSkillResponseDto[]> {
    const records = await this.prisma.candidateSkill.findMany({
      where: { candidateId: candidateId }, // Queries directly by candidateId row value
      include: {
        skill: {
          include: {
            category: true,
          },
        },
      },
    });
    return records.map((node) => this.mapToCandidateSkillResponse(node));
  }
}