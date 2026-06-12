import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Storage, Bucket } from '@google-cloud/storage';
import { randomUUID } from 'crypto';
import * as path from 'path';
import { ConfigService } from '../env/config.service';
import { PubSubService } from '../pubsub/pubsub.service';
import { PubSubTopic } from '../pubsub/enums/topic.enum';
import { FileEntity } from './entities/file.entity';
import { FileStatus } from './enums/file-status.enum';
import { UploadResult } from './interfaces/upload-result.interface';
import { FileCleanupMessage } from '../pubsub/interfaces/file-cleanup-message.interface';
import { ImageCompressorService } from './image-compressor.service';

interface MulterLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private storage!: Storage;
  private bucket!: Bucket;
  private bucketName!: string;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    private readonly configService: ConfigService,
    private readonly imageCompressor: ImageCompressorService,
    private readonly pubSubService: PubSubService,
  ) {}

  onModuleInit() {
    const projectId = this.configService.get('GCS_PROJECT_ID');
    const keyFile = this.configService.get('GCS_KEY_FILE');
    this.bucketName = this.configService.get('GCS_BUCKET') || '';

    const options: ConstructorParameters<typeof Storage>[0] = { projectId };
    if (keyFile) {
      options.keyFilename = keyFile;
    }

    this.storage = new Storage(options);
    this.bucket = this.storage.bucket(this.bucketName);
    this.logger.log(`GCS initialized — bucket: ${this.bucketName}`);
  }

  async upload(
    file: Buffer,
    originalName: string,
    folder: string,
    contentType: string,
    uploadedBy?: string,
    status: FileStatus = FileStatus.ACTIVE,
  ): Promise<UploadResult> {
    const fileName = this.generateFileName(originalName);
    const destination = `${folder}/${fileName}`;

    const blob = this.bucket.file(destination);
    await blob.save(file, {
      contentType,
      resumable: false,
      metadata: { cacheControl: 'public, max-age=31536000' },
    });

    const url = this.getPublicUrl(destination);

    const fileRecord = this.fileRepo.create({
      originalName,
      fileName,
      mimeType: contentType,
      size: file.length,
      path: destination,
      url,
      bucket: this.bucketName,
      uploadedBy: uploadedBy || null,
      status,
    });
    const saved = await this.fileRepo.save(fileRecord);

    return {
      id: saved.id,
      url: saved.url,
      path: saved.path,
      originalName: saved.originalName,
      fileName: saved.fileName,
      mimeType: saved.mimeType,
      size: saved.size,
    };
  }

  async uploadDocument(
    file: MulterLike,
    folder: string,
    uploadedBy?: string,
  ): Promise<UploadResult> {
    return this.upload(
      file.buffer,
      file.originalname,
      folder,
      file.mimetype,
      uploadedBy,
    );
  }

  async uploadImage(
    file: MulterLike,
    folder: string,
    uploadedBy?: string,
  ): Promise<UploadResult> {
    const result = await this.upload(
      file.buffer,
      file.originalname,
      folder,
      file.mimetype,
      uploadedBy,
    );

    this.pubSubService
      .publish(PubSubTopic.IMAGE_PROCESSING, 'image.compress', {
        fileId: result.id,
      })
      .catch((error) =>
        this.logger.warn(
          `Could not queue image compression for ${result.id}: ${
            error instanceof Error ? error.message : error
          }`,
        ),
      );

    return result;
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) return;

    const blob = this.bucket.file(file.path);
    const [exists] = await blob.exists();
    if (exists) {
      await blob.delete();
    }

    file.status = FileStatus.DELETED;
    await this.fileRepo.save(file);
    await this.fileRepo.softRemove(file);
  }

  async deleteByUrl(url: string): Promise<void> {
    if (!url) return;
    const prefix = `https://storage.googleapis.com/${this.bucketName}/`;
    if (!url.startsWith(prefix)) return;

    const objectPath = url.slice(prefix.length);
    const blob = this.bucket.file(objectPath);
    const [exists] = await blob.exists();
    if (exists) {
      await blob.delete();
    }

    const record = await this.fileRepo.findOne({ where: { url } });
    if (record) {
      record.status = FileStatus.DELETED;
      await this.fileRepo.save(record);
      await this.fileRepo.softRemove(record);
    }
  }

  async handleFileMessage(
    type: string,
    data: FileCleanupMessage,
  ): Promise<void> {
    if (type === 'file.delete') {
      await this.deleteFile(data.fileId);
    } else if (type === 'image.compress') {
      await this.compressFile(data.fileId, data.options);
    }
  }

  private async compressFile(
    fileId: string,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
    },
  ): Promise<void> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) return;

    try {
      const blob = this.bucket.file(file.path);
      const [buffer] = await blob.download();

      const compressed = await this.imageCompressor.compress(buffer, {
        maxWidth: options?.maxWidth || 800,
        maxHeight: options?.maxHeight || 800,
        quality: options?.quality || 80,
        format: options?.format || 'webp',
      });

      await blob.save(compressed.buffer, {
        contentType: compressed.mimeType,
        resumable: false,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });

      file.mimeType = compressed.mimeType;
      file.size = compressed.buffer.length;
      file.status = FileStatus.ACTIVE;
      await this.fileRepo.save(file);
    } catch (error) {
      this.logger.error(`Failed to compress file ${fileId}`, error);
      file.status = FileStatus.FAILED;
      await this.fileRepo.save(file);
      throw error;
    }
  }

  async moveFile(fileId: string, newPath: string): Promise<FileEntity | null> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) return null;

    const oldBlob = this.bucket.file(file.path);
    const newBlob = this.bucket.file(newPath);

    const [exists] = await oldBlob.exists();
    if (exists) {
      await oldBlob.copy(newBlob);
      await oldBlob.delete();
    }

    file.path = newPath;
    file.url = this.getPublicUrl(newPath);
    file.status = FileStatus.ACTIVE;
    return this.fileRepo.save(file);
  }

  async findById(fileId: string): Promise<FileEntity | null> {
    return this.fileRepo.findOne({ where: { id: fileId } });
  }

  async findByIds(fileIds: string[]): Promise<FileEntity[]> {
    if (!fileIds.length) return [];
    return this.fileRepo.find({ where: { id: In(fileIds) } });
  }

  getFileStream(destination: string): NodeJS.ReadableStream {
    return this.bucket.file(destination).createReadStream();
  }

  async getSignedUrl(
    destination: string,
    expiresInMs: number = 15 * 60 * 1000,
  ): Promise<string> {
    const blob = this.bucket.file(destination);
    const [url] = await blob.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMs,
    });
    return url;
  }

  getPublicUrl(destination: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${destination}`;
  }

  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    return `${randomUUID()}${ext}`;
  }
}
