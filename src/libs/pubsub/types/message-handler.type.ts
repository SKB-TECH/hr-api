import { PubSubMessage } from '../interfaces/pubsub-message.interface';

export type MessageHandler<T = any> = (
  message: PubSubMessage<T>,
) => Promise<void>;
