import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Skill } from '../entities/skill.entity';

@Injectable()
export class SkillRepository extends Repository<Skill> {
  constructor(private dataSource: DataSource) {
    super(Skill, dataSource.createEntityManager());
  }

  async findWithCategory(id: string): Promise<Skill | null> {
    return this.findOne({
      where: { id },
      relations: ['category'],
    });
  }
}