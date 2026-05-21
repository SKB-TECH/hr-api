import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MediaService } from './media.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ApiResponse } from '../../common/response/api-response';

const uploadOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPG, PNG and WEBP images are allowed'), false);
  },
};

@Controller('api/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const media = await this.mediaService.upload(file);
    return ApiResponse.created(
      { mediaId: media.id, url: media.url, filename: media.filename, mimeType: media.mimeType },
      'File uploaded successfully',
    );
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string) {
    await this.mediaService.delete(id);
    return ApiResponse.ok(null, 'File deleted successfully');
  }
}
