import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('hero_section')
export class HeroSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  subtitle: string;

  @Column({ type: 'varchar', length: 500, name: 'image_url', nullable: true })
  imageUrl: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
