import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'languages' })
export class Language {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar' }) name: string;
  @Column({ type: 'varchar', length: 10 }) code: string;
}
