import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  Availability,
  ProfileVisibility,
  WorkType,
} from '../../../../../utils/enums';
import { DecimalTransformer } from '../../../../../utils/transformers/decimal.transformer';
import { User } from '../../../users/entities/user.entity';
import { Resume } from '../../candidate-resume/entities/resume.entity';
import { CandidateEducation } from '../../candidate-education/entities/candidate-education.entity';
import { CandidateExperience } from '../../candidate-experience/entities/candidate-experience.entity';
import { CandidateCertification } from '../../candidate-certificate/entities/candidate-certification.entity';
import { CandidateSkill } from '../../candidate-skill/entities/candidate-skill.entity';
import { CandidatePortfolio } from '../../candidate-portfolio/entities/candidate-portfolio.entity';

@Entity({ name: 'candidate_profiles' })
export class CandidateProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.candidateProfile, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', nullable: true })
  gender: string | null;

  @Column({ name: 'phone_number', type: 'varchar', nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'birth_date', type: 'timestamptz', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  headline: string | null;

  @Column({ type: 'varchar', nullable: true })
  bio: string | null;

  @Column({ name: 'country_name', type: 'varchar', nullable: true })
  countryName: string | null;

  @Column({ name: 'city_name', type: 'varchar', nullable: true })
  cityName: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ name: 'language_codes', type: 'text', array: true, default: () => "'{}'" })
  languageCodes: string[];

  @Column({ name: 'language_proficiencies', type: 'jsonb', default: () => "'[]'::jsonb" })
  languageProficiencies: Array<{ code: string; level: string }>;

  @Column({ name: 'preferred_profession_ids', type: 'uuid', array: true, default: () => "'{}'" })
  preferredProfessionIds: string[];

  @Column({ name: 'preferred_countries', type: 'text', array: true, default: () => "'{}'" })
  preferredCountries: string[];

  @Column({ name: 'preferred_employment_types', type: 'text', array: true, default: () => "'{}'" })
  preferredEmploymentTypes: string[];

  @Column({ name: 'accepts_remote', type: 'boolean', default: false })
  acceptsRemote: boolean;

  @Column({ name: 'expected_salary_min', type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: DecimalTransformer })
  expectedSalaryMin: number | null;

  @Column({ name: 'expected_salary_max', type: 'decimal', precision: 12, scale: 2, nullable: true, transformer: DecimalTransformer })
  expectedSalaryMax: number | null;

  @Column({
    name: 'current_salary',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: DecimalTransformer,
  })
  currentSalary: number | null;

  @Column({
    name: 'expected_salary',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: DecimalTransformer,
  })
  expectedSalary: number | null;

  @Column({ name: 'salary_currency', type: 'varchar', nullable: true })
  salaryCurrency: string | null;

  @Column({ name: 'years_experience', type: 'int', nullable: true })
  yearsExperience: number | null;

  @Column({ name: 'linkedin_url', type: 'varchar', nullable: true })
  linkedinUrl: string | null;

  @Column({ name: 'github_url', type: 'varchar', nullable: true })
  githubUrl: string | null;

  @Column({ name: 'portfolio_url', type: 'varchar', nullable: true })
  portfolioUrl: string | null;

  @Column({ type: 'enum', enum: Availability, nullable: true })
  availability: Availability | null;

  @Column({ name: 'work_type', type: 'enum', enum: WorkType, nullable: true })
  workType: WorkType | null;

  @Column({
    name: 'profile_visibility',
    type: 'enum',
    enum: ProfileVisibility,
    default: ProfileVisibility.public,
  })
  profileVisibility: ProfileVisibility;

  @Column({ name: 'open_to_work', type: 'boolean', default: true })
  openToWork: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Resume, (resume) => resume.candidate)
  resumes: Resume[];

  @OneToMany(() => CandidateEducation, (education) => education.candidate)
  candidate_educations: CandidateEducation[];

  @OneToMany(() => CandidateExperience, (experience) => experience.candidate)
  candidateExperiences: CandidateExperience[];

  @OneToMany(
    () => CandidateCertification,
    (certification) => certification.candidate,
  )
  candidateCertifications: CandidateCertification[];

  @OneToMany(() => CandidateSkill, (skill) => skill.candidate)
  candidateSkills: CandidateSkill[];

  @OneToMany(() => CandidatePortfolio, (portfolio) => portfolio.candidate)
  candidatePortfolios: CandidatePortfolio[];
}
