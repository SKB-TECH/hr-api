import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor() {}

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'infinity job image',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // validate image
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      throw new BadRequestException('Invalid file type. Only image files are allowed.');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }

  async replaceImage(
    file: Express.Multer.File,
    oldPublicId: string,
    folder: string = 'infinity job image',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (oldPublicId) {
      await this.deleteImage(oldPublicId);
    }
    return this.uploadImage(file, folder);
  }
}
