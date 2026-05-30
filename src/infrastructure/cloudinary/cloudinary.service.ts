import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor() {}

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'infinity_job_assets',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    //  Guard: Support images AND pdf documents
    const isImage = file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/);
    const isPdf = file.mimetype === 'application/pdf';

    if (!isImage && !isPdf) {
      throw new BadRequestException('Invalid file type. Only images (jpg, jpeg, png, gif, webp) and PDF files are allowed.');
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: any = {
        folder: folder,
      };

      if (isPdf) {
        uploadOptions.resource_type = 'raw'; 
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'infinity job image',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return this.uploadFile(file, folder);
  }

  async deleteFile(publicId: string, isPdf: boolean = false): Promise<any> {
    return new Promise((resolve, reject) => {
      // Raw assets (PDFs) require the resource_type specified when running destroy()
      const options = isPdf ? { resource_type: 'raw' } : {};
      
      cloudinary.uploader.destroy(publicId, options, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    return this.deleteFile(publicId, false);
  }

  async replaceFile(
    file: Express.Multer.File,
    oldPublicId: string,
    folder: string = 'infinity_job_assets',
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    if (oldPublicId) {
      const isPdf = file.mimetype === 'application/pdf';
      await this.deleteFile(oldPublicId, isPdf);
    }
    return this.uploadFile(file, folder);
  }
}