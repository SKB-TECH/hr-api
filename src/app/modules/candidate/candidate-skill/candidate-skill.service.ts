import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateCategoryDto,
  CreateSkillDto,
  AssignSkillDto,
} from './dto/skill-management.dto';
import {
  CategoryResponseDto,
  SkillResponseDto,
  CandidateSkillResponseDto,
} from './dto/skill-management-response.dto';
import { CandidateSkill } from './entities/candidate-skill.entity';
import { Skill } from './entities/skill.entity';
import { SkillCategory } from './entities/skill-category.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Injectable()
export class SkillManagementService {
  constructor(
    @InjectRepository(CandidateSkill)
    private readonly candidateSkillRepo: Repository<CandidateSkill>,
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(SkillCategory)
    private readonly skillCategoryRepo: Repository<SkillCategory>,
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepo: Repository<CandidateProfile>,
  ) {}

  async createCategory(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const existing = await this.skillCategoryRepo.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Category with name '${dto.name}' already exists.`,
      );
    }

    const category = this.skillCategoryRepo.create({ name: dto.name });
    return this.skillCategoryRepo.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const target = await this.skillCategoryRepo.findOne({
      where: { id },
    });

    if (!target) {
      throw new NotFoundException(
        `Category record with ID "${id}" was not found.`,
      );
    }

    await this.skillCategoryRepo.delete(id);
  }

  async findAllCategories(): Promise<CategoryResponseDto[]> {
    return this.skillCategoryRepo.find();
  }

  async createSkill(dto: CreateSkillDto): Promise<SkillResponseDto> {
    const categoryExists = await this.skillCategoryRepo.findOne({
      where: { id: dto.categoryId },
    });

    if (!categoryExists) {
      throw new NotFoundException(
        `Cannot add skill. SkillCategory ID "${dto.categoryId}" does not exist.`,
      );
    }

    const generatedSlug = dto.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const uniqueCheck = await this.skillRepo.findOne({
      where: [{ name: dto.name }, { slug: generatedSlug }],
    });

    if (uniqueCheck) {
      throw new ConflictException(
        'A skill with this name or slug already exists in the system.',
      );
    }

    const created = this.skillRepo.create({
      name: dto.name,
      slug: generatedSlug,
      categoryId: dto.categoryId,
    });
    const saved = await this.skillRepo.save(created);

    const newSkill = await this.skillRepo.findOne({
      where: { id: saved.id },
      relations: { category: true },
    });

    return this.mapToSkillResponse(newSkill);
  }

  async findAllSkills(): Promise<SkillResponseDto[]> {
    const skills = await this.skillRepo.find({
      relations: { category: true },
    });
    return skills.map((item) => this.mapToSkillResponse(item));
  }

  async assignSkillToCandidate(
    userId: string,
    dto: AssignSkillDto,
  ): Promise<CandidateSkillResponseDto> {
    const profile = await this.candidateProfileRepo.findOne({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException(
        `Cannot assign skill. Candidate profile record for User ID "${userId}" does not exist.`,
      );
    }

    const skillExists = await this.skillRepo.findOne({
      where: { id: dto.skillId },
    });

    if (!skillExists) {
      throw new NotFoundException(
        'The requested skill does not exist in the master directory.',
      );
    }

    let row = await this.candidateSkillRepo.findOne({
      where: { candidateId: profile.id, skillId: dto.skillId },
    });
    if (row) {
      this.candidateSkillRepo.merge(row, {
        level: dto.level,
        yearsExperience: dto.yearsExperience,
      });
    } else {
      row = this.candidateSkillRepo.create({
        candidateId: profile.id,
        skillId: dto.skillId,
        level: dto.level,
        yearsExperience: dto.yearsExperience,
      });
    }
    await this.candidateSkillRepo.save(row);

    const candidateSkillRow = await this.candidateSkillRepo.findOne({
      where: { id: row.id },
      relations: { skill: { category: true } },
    });

    return this.mapToCandidateSkillResponse(candidateSkillRow);
  }

  async getCandidateSkills(
    userId: string,
  ): Promise<CandidateSkillResponseDto[]> {
    const profile = await this.candidateProfileRepo.findOne({
      where: { userId: userId },
    });

    if (!profile) {
      return [];
    }

    const records = await this.candidateSkillRepo.find({
      where: { candidateId: profile.id },
      relations: { skill: { category: true } },
    });
    return records.map((node) => this.mapToCandidateSkillResponse(node));
  }

  async removeSkillFromCandidate(
    userId: string,
    candidateSkillId: string,
  ): Promise<void> {
    const profile = await this.candidateProfileRepo.findOne({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException('Candidate profile record not found.');
    }

    const record = await this.candidateSkillRepo.findOne({
      where: {
        id: candidateSkillId,
        candidateId: profile.id,
      },
    });

    if (!record) {
      throw new NotFoundException(
        'This skill mapping assignment was not found on your profile.',
      );
    }

    await this.candidateSkillRepo.delete(record.id);
  }

  private mapToSkillResponse(item: any): SkillResponseDto {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      category: item.category
        ? { id: item.category.id, name: item.category.name }
        : null,
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

  async getSkillsByCandidateProfileId(
    candidateId: string,
  ): Promise<CandidateSkillResponseDto[]> {
    const records = await this.candidateSkillRepo.find({
      where: { candidateId: candidateId },
      relations: { skill: { category: true } },
    });
    return records.map((node) => this.mapToCandidateSkillResponse(node));
  }
}
