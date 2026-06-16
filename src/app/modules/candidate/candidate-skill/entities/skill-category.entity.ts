import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Skill } from './skill.entity';

@Entity({ name: 'skill_categories' })
export class SkillCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @OneToMany(() => Skill, (skill) => skill.category)
  skills: Skill[];
}
