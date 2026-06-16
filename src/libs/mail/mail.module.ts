import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailWorker } from './mail.worker';
import { ConfigModule } from '../env/config.module';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MailService, MailWorker],
  exports: [MailService],
})
export class MailModule {}
