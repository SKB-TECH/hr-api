import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { LocalStorageProvider } from './media.storage';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    private readonly storage: LocalStorageProvider,
  ) {}

  async upload(file: Express.Multer.File, usedBy?: string): Promise<Media> {
    const { url, filename } = await this.storage.upload(file);

    const media = this.mediaRepo.create({
      url,
      filename,
      mimeType: file.mimetype,
      usedBy: usedBy ?? null,
    });

    return this.mediaRepo.save(media);
  }

  async delete(id: string): Promise<void> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) throw new NotFoundException(`Media ${id} not found`);

    await this.storage.delete(media.filename);
    await this.mediaRepo.remove(media);
  }
}
