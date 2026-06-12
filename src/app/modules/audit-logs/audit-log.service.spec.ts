import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from './entities/audit-log.entity';

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

const mockAuditLogRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
};

describe('AuditLogService', () => {
  let service: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: getRepositoryToken(AuditLog), useValue: mockAuditLogRepo },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit log entry with all fields', async () => {
      const input = {
        userId: 'uuid-user-1',
        action: 'UPDATE_EMAIL',
        module: 'users',
        oldValues: { email: 'old@example.com' },
        newValues: { email: 'new@example.com' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      };
      mockAuditLogRepo.create.mockReturnValue(input);
      mockAuditLogRepo.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(input);

      expect(result).toEqual(mockAuditLog);
      expect(mockAuditLogRepo.create).toHaveBeenCalledWith(input);
      expect(mockAuditLogRepo.save).toHaveBeenCalledWith(input);
    });

    it('should create a log without userId for system-triggered actions', async () => {
      const input = {
        action: 'SYSTEM_CLEANUP',
        module: 'system',
      };
      const systemLog = { ...mockAuditLog, userId: null };
      mockAuditLogRepo.create.mockReturnValue(input);
      mockAuditLogRepo.save.mockResolvedValue(systemLog);

      const result = await service.log(input);

      expect(result.userId).toBeNull();
      expect(mockAuditLogRepo.create).toHaveBeenCalledWith(input);
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const logs = [mockAuditLog, { ...mockAuditLog, id: 'uuid-log-2' }];
      mockAuditLogRepo.find.mockResolvedValue(logs);
      mockAuditLogRepo.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.totalItems).toBe(2);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should pass all filters to the repository', async () => {
      mockAuditLogRepo.find.mockResolvedValue([]);
      mockAuditLogRepo.count.mockResolvedValue(0);

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

      expect(mockAuditLogRepo.find).toHaveBeenCalled();
      const findArgs = mockAuditLogRepo.find.mock.calls[0][0];
      expect(findArgs.where.module).toBe('users');
      expect(findArgs.where.action).toBe('UPDATE_EMAIL');
      expect(findArgs.where.userId).toBe('uuid-user-1');
      expect(findArgs.skip).toBe(0);
      expect(findArgs.take).toBe(10);
      expect(findArgs.relations).toEqual({ user: true });
    });

    it('should calculate hasNextPage correctly when more pages exist', async () => {
      const logs = Array.from({ length: 10 }, (_, i) => ({
        ...mockAuditLog,
        id: `uuid-log-${i}`,
      }));
      mockAuditLogRepo.find.mockResolvedValue(logs);
      mockAuditLogRepo.count.mockResolvedValue(35);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(4);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should use default page=1 and limit=20 when not provided', async () => {
      mockAuditLogRepo.find.mockResolvedValue([]);
      mockAuditLogRepo.count.mockResolvedValue(0);

      const result = await service.findAll({});

      expect(result.meta.currentPage).toBe(1);
    });

    it('should return hasPreviousPage true when on page 2+', async () => {
      mockAuditLogRepo.find.mockResolvedValue([]);
      mockAuditLogRepo.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 3, limit: 10 });

      expect(result.meta.hasPreviousPage).toBe(true);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.currentPage).toBe(3);
    });
  });
});
