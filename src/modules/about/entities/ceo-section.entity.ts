import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('ceo_section')
export class CeoSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, name: 'job_title' })
  jobTitle: string;

  @Column({ type: 'varchar', length: 500, name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ type: 'text' })
  message: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
