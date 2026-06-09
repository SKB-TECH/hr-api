import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { AuditLogRepository } from './audit-log.repository';

const mockAuditLog = {
  id: 'uuid-log-1',
  userId: 'uuid-user-1',
  action: 'UPDATE_EMAIL',
  module: 'users',
  oldValues: { email: 'old@example.com' },
  newValues: { email: 'new@example.com' },
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  createdAt: new Date(),
};

const mockAuditLogRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
};

describe('AuditLogService', () => {
  let service: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: AuditLogRepository, useValue: mockAuditLogRepository },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry with all fields', async () => {
      mockAuditLogRepository.create.mockResolvedValue(mockAuditLog);

      const result = await service.log({
        userId: 'uuid-user-1',
        action: 'UPDATE_EMAIL',
        module: 'users',
        oldValues: { email: 'old@example.com' },
        newValues: { email: 'new@example.com' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result).toEqual(mockAuditLog);
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith({
        userId: 'uuid-user-1',
        action: 'UPDATE_EMAIL',
        module: 'users',
        oldValues: { email: 'old@example.com' },
        newValues: { email: 'new@example.com' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
    });

    it('should create a log without userId for system-triggered actions', async () => {
      const systemLog = { ...mockAuditLog, userId: null };
      mockAuditLogRepository.create.mockResolvedValue(systemLog);

      const result = await service.log({
        action: 'SYSTEM_CLEANUP',
        module: 'system',
      });

      expect(result.userId).toBeNull();
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith({
        action: 'SYSTEM_CLEANUP',
        module: 'system',
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const logs = [mockAuditLog, { ...mockAuditLog, id: 'uuid-log-2' }];
      mockAuditLogRepository.findAll.mockResolvedValue({
        data: logs,
        totalItems: 2,
      });

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.totalItems).toBe(2);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should pass all filters to the repository', async () => {
      mockAuditLogRepository.findAll.mockResolvedValue({
        data: [],
        totalItems: 0,
      });

      const query = {
        module: 'users',
        action: 'UPDATE_EMAIL',
        userId: 'uuid-user-1',
        from: '2026-01-01',
        to: '2026-12-31',
        page: 1,
        limit: 10,
      };

      await service.findAll(query);

      expect(mockAuditLogRepository.findAll).toHaveBeenCalledWith(query);
    });

    it('should calculate hasNextPage correctly when more pages exist', async () => {
      const logs = Array.from({ length: 10 }, (_, i) => ({
        ...mockAuditLog,
        id: `uuid-log-${i}`,
      }));
      mockAuditLogRepository.findAll.mockResolvedValue({
        data: logs,
        totalItems: 35,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(4);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should use default page=1 and limit=20 when not provided', async () => {
      mockAuditLogRepository.findAll.mockResolvedValue({
        data: [],
        totalItems: 0,
      });

      const result = await service.findAll({});

      expect(result.meta.currentPage).toBe(1);
      expect(mockAuditLogRepository.findAll).toHaveBeenCalledWith({});
    });

    it('should return hasPreviousPage true when on page 2+', async () => {
      mockAuditLogRepository.findAll.mockResolvedValue({
        data: [],
        totalItems: 50,
      });

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.meta.hasPreviousPage).toBe(true);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.currentPage).toBe(3);
    });
  });
});
