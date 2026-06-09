import { Injectable } from '@nestjs/common';
import { AuditLogRepository, CreateAuditLogData } from './audit-log.repository';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { createPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  log(data: CreateAuditLogData) {
    return this.auditLogRepository.create(data);
  }

  async findAll(query: QueryAuditLogDto) {
    const { data, totalItems } = await this.auditLogRepository.findAll(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return createPaginatedResult(data, totalItems, page, limit);
  }
}
