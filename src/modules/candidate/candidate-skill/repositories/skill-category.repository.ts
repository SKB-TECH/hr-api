import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SkillCategory } from '../entities/skill-category.entity';

@Injectable()
export class SkillCategoryRepository extends Repository<SkillCategory> {
  constructor(private dataSource: DataSource) {
    super(SkillCategory, dataSource.createEntityManager());
  }
}