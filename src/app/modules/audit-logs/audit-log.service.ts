import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  FindOptionsWhere,
} from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { createPaginatedResult } from '../../../helpers/pagination/pagination.util';
import { CreateAuditLogData } from './interfaces/create-audit-log-data.interface';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  log(data: CreateAuditLogData) {
    const entity = this.auditLogRepo.create(data as Partial<AuditLog>);
    return this.auditLogRepo.save(entity);
  }

  async findAll(query: QueryAuditLogDto) {
    const { module, action, userId, from, to } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: FindOptionsWhere<AuditLog> = {};
    if (module) where.module = module;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (from && to) {
      where.createdAt = Between(new Date(from), new Date(to));
    } else if (from) {
      where.createdAt = MoreThanOrEqual(new Date(from));
    } else if (to) {
      where.createdAt = LessThanOrEqual(new Date(to));
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.auditLogRepo.find({
        where,
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: { user: true },
      }),
      this.auditLogRepo.count({ where }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }
}
