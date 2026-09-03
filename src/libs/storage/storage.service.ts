import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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
import { MulterLike } from './interfaces/multer-like.interface';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private storage!: S3Client;
  private bucketName!: string;
  private publicUrl!: string;

  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepo: Repository<FileEntity>,
    private readonly configService: ConfigService,
    private readonly imageCompressor: ImageCompressorService,
    private readonly pubSubService: PubSubService,
  ) {}

  onModuleInit() {
    const region = this.configService.get('S3_REGION');
    const endpoint = this.configService.get('S3_ENDPOINT');
    const accessKeyId = this.configService.get('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get('S3_SECRET_KEY');
    this.bucketName = this.configService.get('S3_BUCKET') || '';
    this.publicUrl = (
      this.configService.get('S3_PUBLIC_URL') ||
      `https://${this.bucketName}.s3.${region}.amazonaws.com`
    ).replace(/\/$/, '');
    if (!region || !this.bucketName || !accessKeyId || !secretAccessKey)
      throw new Error('S3 storage configuration is incomplete');

    this.storage = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      forcePathStyle: this.configService.get('S3_FORCE_PATH_STYLE') === 'true',
      credentials: { accessKeyId, secretAccessKey },
    });
    this.logger.log(`S3 initialized — bucket: ${this.bucketName}`);
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

    await this.storage.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: destination,
        Body: file,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000',
      }),
    );

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

  async deleteFile(fileId: string, requestedBy?: string): Promise<void> {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) return;
    if (requestedBy && file.uploadedBy !== requestedBy)
      throw new ForbiddenException('You cannot delete this file');

    await this.storage.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: file.path }),
    );

    file.status = FileStatus.DELETED;
    await this.fileRepo.save(file);
    await this.fileRepo.softRemove(file);
  }

  async downloadFile(
    fileId: string,
    requestedBy?: string,
  ): Promise<{
    buffer: Buffer;
    mimeType: string;
    originalName: string;
  }> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, status: FileStatus.ACTIVE },
    });
    if (!file)
      throw new NotFoundException('Stored file not found or unavailable');
    if (requestedBy && file.uploadedBy !== requestedBy)
      throw new ForbiddenException('You cannot download this file');
    const response = await this.storage.send(
      new GetObjectCommand({ Bucket: this.bucketName, Key: file.path }),
    );
    if (!response.Body) throw new Error('Stored file has no content');
    const buffer = Buffer.from(await response.Body.transformToByteArray());
    return {
      buffer,
      mimeType: file.mimeType,
      originalName: file.originalName,
    };
  }

  async deleteByUrl(url: string): Promise<void> {
    if (!url) return;
    const prefix = `${this.publicUrl}/`;
    if (!url.startsWith(prefix)) return;

    const objectPath = url.slice(prefix.length);
    await this.storage.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: objectPath }),
    );

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
      const source = await this.storage.send(
        new GetObjectCommand({ Bucket: this.bucketName, Key: file.path }),
      );
      if (!source.Body) throw new Error('Stored image has no content');
      const buffer = Buffer.from(await source.Body.transformToByteArray());

      const compressed = await this.imageCompressor.compress(buffer, {
        maxWidth: options?.maxWidth || 800,
        maxHeight: options?.maxHeight || 800,
        quality: options?.quality || 80,
        format: options?.format || 'webp',
      });

      await this.storage.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: file.path,
          Body: compressed.buffer,
          ContentType: compressed.mimeType,
          CacheControl: 'public, max-age=31536000',
        }),
      );

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

  getPublicUrl(destination: string): string {
    const encodedPath = destination
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
    return `${this.publicUrl}/${encodedPath}`;
  }

  private generateFileName(originalName: string): string {
    const ext = path.extname(originalName);
    return `${randomUUID()}${ext}`;
  }
}
