import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface StorageProvider {
  upload(file: Express.Multer.File): Promise<{ url: string; filename: string }>;
  delete(filename: string): Promise<void>;
}

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  async upload(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    const dest = path.join(this.uploadDir, filename);
    fs.writeFileSync(dest, file.buffer);

    const port = process.env.PORT ?? 3000;
    return {
      filename,
      url: `http://localhost:${port}/files/${filename}`,
    };
  }

  async delete(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
