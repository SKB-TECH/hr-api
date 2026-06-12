import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PubSubService } from '../pubsub/pubsub.service';
import { PubSubTopic } from '../pubsub/enums/topic.enum';
import { StorageService } from './storage.service';
import { FileCleanupMessage } from '../pubsub/interfaces/file-cleanup-message.interface';

@Injectable()
export class FileCleanupWorker implements OnModuleInit {
  private readonly logger = new Logger(FileCleanupWorker.name);

  constructor(
    private readonly pubSubService: PubSubService,
    private readonly storageService: StorageService,
  ) {}

  async onModuleInit() {
    if (!this.pubSubService.isEnabled()) {
      this.logger.log('Pub/Sub disabled — file cleanup worker idle');
      return;
    }

    try {
      await this.pubSubService.subscribe<FileCleanupMessage>(
        PubSubTopic.IMAGE_PROCESSING,
        `${PubSubTopic.IMAGE_PROCESSING}-worker`,
        (message) =>
          this.storageService.handleFileMessage(message.type, message.data),
        {
          deadLetterTopic: PubSubTopic.IMAGE_PROCESSING_DLQ,
          maxDeliveryAttempts: 5,
        },
      );
    } catch {
      this.logger.warn('File cleanup worker subscription not available');
    }
  }
}
