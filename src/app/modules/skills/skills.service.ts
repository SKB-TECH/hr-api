import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Skill } from '../candidate/candidate-skill/entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillCategory } from '../candidate/candidate-skill/entities/skill-category.entity';
import slugify from 'slugify';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
    @InjectRepository(SkillCategory)
    private readonly categoryRepo: Repository<SkillCategory>,
  ) {}

  async createSkill(createSkillDto: CreateSkillDto) {
    const category = await this.categoryRepo.findOne({
      where: { id: createSkillDto.categoryId },
    });
    if (!category) throw new NotFoundException('Skill category not found');
    const existingSkill = await this.skillRepo.findOne({
      where: { name: ILike(createSkillDto.name) },
    });

    if (existingSkill) {
      throw new ConflictException(
        `The skill '${createSkillDto.name}' already exists.`,
      );
    }

    const skill = this.skillRepo.create({
      name: createSkillDto.name.trim(),
      slug: slugify(createSkillDto.name, { lower: true, strict: true }),
      categoryId: category.id,
    });
    return this.skillRepo.save(skill);
  }

  async createCategory(name: string) {
    const normalized = name.trim();
    const existing = await this.categoryRepo.findOne({
      where: { name: ILike(normalized) },
    });
    if (existing) return existing;
    return this.categoryRepo.save(
      this.categoryRepo.create({ name: normalized }),
    );
  }

  findAllCategories() {
    return this.categoryRepo.find({ order: { name: 'ASC' } });
  }

  async findAllSkills(q?: string, limit = 30) {
    return this.skillRepo.find({
      where: q ? { name: ILike(`%${q}%`) } : {},
      order: { name: 'ASC' },
      relations: { category: true },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }
}
