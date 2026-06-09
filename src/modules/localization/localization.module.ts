import { Module } from '@nestjs/common';
import { LocalizationService } from './localization.service';
import { LocalizationController } from './localization.controller';

@Module({
  controllers: [LocalizationController],
  providers: [LocalizationService],
})
export class LocalizationModule {}
