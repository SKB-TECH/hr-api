import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const mockCompany = {
  id: 'uuid-company-1',
  name: 'Nomad',
  slug: 'nomad',
  description: 'Nomad is located in Paris, France.',
  industry: 'Business Service',
  location: 'Paris, France',
  companySize: 'startup',
  logo: null,
  coverImage: null,
  website: 'https://nomad.com',
  facebook: null,
  twitter: null,
  instagram: null,
  linkedin: null,
  youtube: null,
  foundationDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  company: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  companyMember: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('CompaniesService', () => {
  let service: CompaniesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated companies with default page and limit', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockCompany], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should filter by search keyword on name and description', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockCompany], 1]);

      await service.findAll({ search: 'Nomad' });

      const [[findManyCall]] = mockPrismaService.$transaction.mock.calls;
      expect(findManyCall).toBeDefined();
    });

    it('should filter by location', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockCompany], 1]);

      const result = await service.findAll({ location: 'Paris' });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by industry', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockCompany], 1]);

      const result = await service.findAll({ industry: 'Business Service' });

      expect(result.data).toHaveLength(1);
    });

    it('should calculate hasNextPage correctly', async () => {
      const companies = Array.from({ length: 12 }, (_, i) => ({ ...mockCompany, id: `uuid-${i}` }));
      mockPrismaService.$transaction.mockResolvedValue([companies, 30]);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should return empty data when no companies match filters', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      const result = await service.findAll({ search: 'nonexistent' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a company with its members', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ ...mockCompany, members: [] });

      const result = await service.findOne('uuid-company-1');

      expect(result.id).toBe('uuid-company-1');
      expect(result).toHaveProperty('members');
    });

    it('should throw NotFoundException when company does not exist', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the company', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ ...mockCompany, members: [] });
      mockPrismaService.company.update.mockResolvedValue({ ...mockCompany, name: 'Nomad Updated' });

      const result = await service.update('uuid-company-1', { name: 'Nomad Updated' });

      expect(result.name).toBe('Nomad Updated');
    });

    it('should throw NotFoundException when updating a non-existent company', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' })).rejects.toThrow(NotFoundException);
    });
  });
});
