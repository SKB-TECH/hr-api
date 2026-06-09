import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CandidateSkill } from '../entities/candidate-skill.entity';

@Injectable()
export class CandidateSkillRepository extends Repository<CandidateSkill> {
  constructor(private dataSource: DataSource) {
    super(CandidateSkill, dataSource.createEntityManager());
  }

  async findByCandidate(candidateId: string): Promise<CandidateSkill[]> {
    return this.find({
      where: { candidateId },
      relations: ['skill', 'skill.category'],
    });
  }
}