import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Skill } from '../candidate/candidate-skill/entities/skill.entity';
import { CreateSkillDto } from './dto/create-skill.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private readonly skillRepo: Repository<Skill>,
  ) {}

  async createSkill(createSkillDto: CreateSkillDto) {
    const existingSkill = await this.skillRepo.findOne({
      where: { name: ILike(createSkillDto.name) },
    });

    if (existingSkill) {
      throw new ConflictException(
        `The skill '${createSkillDto.name}' already exists.`,
      );
    }

    const skill = this.skillRepo.create({
      name: createSkillDto.name,
      category: createSkillDto.category,
    } as any);
    return this.skillRepo.save(skill);
  }

  async findAllSkills() {
    return this.skillRepo.find({
      order: { name: 'ASC' },
      relations: { category: true },
    });
  }
}
