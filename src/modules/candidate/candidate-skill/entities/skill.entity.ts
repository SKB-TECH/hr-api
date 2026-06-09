import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { SkillCategory } from './skill-category.entity';
import { CandidateSkill } from './candidate-skill.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => SkillCategory, (category) => category.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: SkillCategory;

  @OneToMany(() => CandidateSkill, (candidateSkill) => candidateSkill.skill)
  candidateSkills: CandidateSkill[];
}