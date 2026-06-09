import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';

const mockPaginatedResult = {
  data: [
    {
      id: 'uuid-log-1',
      userId: 'uuid-user-1',
      action: 'UPDATE_EMAIL',
      module: 'users',
      oldValues: { email: 'old@example.com' },
      newValues: { email: 'new@example.com' },
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      user: {
        id: 'uuid-user-1',
        email: 'admin@example.com',
        fullName: 'Admin',      
        role: 'ADMIN',
      },
    },
  ],
  meta: {
    totalItems: 1,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

const mockAuditLogService = {
  findAll: jest.fn(),
};

describe('AuditLogController', () => {
  let controller: AuditLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogController],
      providers: [{ provide: AuditLogService, useValue: mockAuditLogService }],
    }).compile();

    controller = module.get<AuditLogController>(AuditLogController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should call auditLogService.findAll and return paginated logs', async () => {
      mockAuditLogService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll({});

      expect(result).toEqual(mockPaginatedResult);
      expect(mockAuditLogService.findAll).toHaveBeenCalledWith({});
    });

    it('should forward query filters to the service', async () => {
      mockAuditLogService.findAll.mockResolvedValue(mockPaginatedResult);

      const query = {
        module: 'users',
        action: 'UPDATE_EMAIL',
        page: 1,
        limit: 10,
      };
      await controller.findAll(query);

      expect(mockAuditLogService.findAll).toHaveBeenCalledWith(query);
    });

    it('should return empty data array when no logs match filters', async () => {
      mockAuditLogService.findAll.mockResolvedValue({
        data: [],
        meta: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      const result = await controller.findAll({ module: 'nonexistent' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
    });
  });
});
