import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { CompressOptions } from './interfaces/compress-options.interface';
import { CompressResult } from './interfaces/compress-result.interface';

@Injectable()
export class ImageCompressorService {
  async compress(
    input: Buffer,
    options: CompressOptions = {},
  ): Promise<CompressResult> {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 80,
      format = 'webp',
    } = options;

    let pipeline = sharp(input).rotate();

    const metadata = await sharp(input).metadata();
    if (
      (metadata.width && metadata.width > maxWidth) ||
      (metadata.height && metadata.height > maxHeight)
    ) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
    }

    const buffer = await pipeline.toBuffer();
    const outputMetadata = await sharp(buffer).metadata();

    return {
      buffer,
      mimeType: `image/${format}`,
      width: outputMetadata.width || 0,
      height: outputMetadata.height || 0,
      size: buffer.length,
    };
  }
}
