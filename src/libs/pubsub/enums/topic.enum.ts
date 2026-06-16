export enum PubSubTopic {
  EMAIL_QUEUE = 'email-queue',
  IMAGE_PROCESSING = 'image-processing',
  PUSH_NOTIFICATIONS = 'push-notifications',
  AUDIT_LOG = 'audit-log',
  EMAIL_QUEUE_DLQ = 'email-queue-dlq',
  IMAGE_PROCESSING_DLQ = 'image-processing-dlq',
  SMS_QUEUE = 'sms-queue',
  SMS_QUEUE_DLQ = 'sms-queue-dlq',
  SESSION_LOG = 'session-log',
  SESSION_LOG_DLQ = 'session-log-dlq',
}
