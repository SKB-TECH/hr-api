import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FileStatus } from '../enums/file-status.enum';

@Entity({ name: 'files' })
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  originalName: string;

  @Column({ type: 'varchar' })
  fileName: string;

  @Column({ type: 'varchar' })
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ type: 'varchar' })
  path: string;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar', nullable: true })
  bucket: string | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  uploadedBy: string | null;

  @Index()
  @Column({ type: 'enum', enum: FileStatus, default: FileStatus.ACTIVE })
  status: FileStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
