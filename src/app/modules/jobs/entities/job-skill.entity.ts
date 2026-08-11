import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Job } from './job.entity';
import { Skill } from '../../candidate/candidate-skill/entities/skill.entity';
import { JobSkillRequirement } from '../../../../utils/enums';

@Entity({ name: 'job_skills' })
@Unique(['jobId', 'skillId'])
export class JobSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'job_id', type: 'uuid' })
  jobId: string;

  @ManyToOne(() => Job, (job) => job.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ name: 'skill_id', type: 'uuid' })
  skillId: string;

  @ManyToOne(() => Skill, (skill) => skill.jobSkills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({
    name: 'requirement_type',
    type: 'varchar',
    default: JobSkillRequirement.REQUIRED,
  })
  requirementType: JobSkillRequirement;

  @Column({ name: 'is_hard_requirement', type: 'boolean', default: false })
  isHardRequirement: boolean;
}
