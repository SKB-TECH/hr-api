export interface PubSubMessage<T = any> {
  type: string;
  data: T;
  timestamp: string;
}
