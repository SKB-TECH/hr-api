import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'countries' })
export class Country {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar' }) name: string;
  @Column({ type: 'varchar', length: 10 }) code: string;
  @Column({ name: 'phone_code', type: 'varchar', nullable: true }) phoneCode: string | null;
}
