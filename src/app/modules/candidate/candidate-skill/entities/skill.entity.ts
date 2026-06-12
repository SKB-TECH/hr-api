import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SkillCategory } from './skill-category.entity';
import { CandidateSkill } from './candidate-skill.entity';
import { JobSkill } from '../../../jobs/entities/job-skill.entity';

@Entity({ name: 'skills' })
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => SkillCategory, (category) => category.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: SkillCategory;

  @OneToMany(() => CandidateSkill, (candidateSkill) => candidateSkill.skill)
  candidateSkills: CandidateSkill[];

  @OneToMany(() => JobSkill, (jobSkill) => jobSkill.skill)
  jobSkills: JobSkill[];
}
