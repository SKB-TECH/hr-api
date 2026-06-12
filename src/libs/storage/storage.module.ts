import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageService } from './storage.service';
import { ImageCompressorService } from './image-compressor.service';
import { FileCleanupWorker } from './file-cleanup.worker';
import { FileEntity } from './entities/file.entity';
import { ConfigModule } from '../env/config.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), ConfigModule],
  providers: [StorageService, ImageCompressorService, FileCleanupWorker],
  exports: [StorageService, ImageCompressorService],
})
export class StorageModule {}
