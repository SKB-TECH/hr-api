import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'int', name: 'salary_min' })
  salaryMin: number;

  @Column({ type: 'int', name: 'salary_max' })
  salaryMax: number;

  @Column({ type: 'varchar', length: 255, name: 'salary_extras', nullable: true })
  salaryExtras: string;

  @Column({ type: 'varchar', length: 255, name: 'job_type' })
  jobType: string;

  @Column({ type: 'varchar', length: 100 })
  reference: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500, name: 'banner_url', nullable: true })
  bannerUrl: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
