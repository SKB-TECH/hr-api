import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { SkillLevel } from '../../../../../utils/enums';
import { Skill } from './skill.entity';
import { CandidateProfile } from '../../candidate-profile/entities/candidate-profile.entity';

@Entity({ name: 'candidate_skills' })
@Unique(['candidateId', 'skillId'])
export class CandidateSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'candidate_id', type: 'uuid' })
  candidateId: string;

  @ManyToOne(() => CandidateProfile, (candidate) => candidate.candidateSkills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'candidate_id' })
  candidate: CandidateProfile;

  @Index()
  @Column({ name: 'skill_id', type: 'uuid' })
  skillId: string;

  @ManyToOne(() => Skill, (skill) => skill.candidateSkills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({ type: 'enum', enum: SkillLevel, nullable: true })
  level: SkillLevel | null;

  @Column({ name: 'years_experience', type: 'int', nullable: true })
  yearsExperience: number | null;
}
