import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '@/app/modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/app/modules/auth/guards/jwt-auth.guard';
import { sendResult } from '@/helpers/message/sendResult';
import { StorageService } from './storage.service';
import { UserRole } from '@/utils/enums';

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

@ApiTags('Files / S3')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a platform file to S3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_TYPES.has(file.mimetype))
      throw new BadRequestException('Unsupported file type');
    const data = file.mimetype.startsWith('image/')
      ? await this.storage.uploadImage(file, `users/${user.id}/images`, user.id)
      : await this.storage.uploadDocument(
          file,
          `users/${user.id}/documents`,
          user.id,
        );
    return sendResult(HttpStatus.CREATED, 'File uploaded to S3', data);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a stored platform file from S3' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Res() response: Response,
  ) {
    const file = await this.storage.downloadFile(
      id,
      [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)
        ? undefined
        : user.id,
    );
    const safeName = file.originalName.replace(/["\r\n]/g, '_');
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeName}"`,
    );
    response.send(file.buffer);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete one of my files from S3' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    await this.storage.deleteFile(id, user.id);
    return sendResult(HttpStatus.OK, 'File deleted', { id });
  }
}
