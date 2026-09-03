import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformReference } from './entities/platform-reference.entity';
import { PlatformReferencesController } from './platform-references.controller';
import { PlatformReferencesService } from './platform-references.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformReference])],
  controllers: [PlatformReferencesController],
  providers: [PlatformReferencesService],
  exports: [PlatformReferencesService],
})
export class PlatformReferencesModule {}
