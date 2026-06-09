import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Skill } from './skill.entity';

@Entity('skill_categories')
export class SkillCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @OneToMany(() => Skill, (skill) => skill.category)
  skills: Skill[];
}