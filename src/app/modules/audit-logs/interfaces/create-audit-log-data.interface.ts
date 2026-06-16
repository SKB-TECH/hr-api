export interface CreateAuditLogData {
  userId?: string;
  action: string;
  module: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
