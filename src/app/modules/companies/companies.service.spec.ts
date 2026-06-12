import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CompanyMember } from './entities/company-member.entity';

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

const createQueryBuilderMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn(),
  getMany: jest.fn(),
  getCount: jest.fn(),
  getRawMany: jest.fn(),
});

const mockCompanyRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockCompanyMemberRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn(),
};

describe('CompaniesService', () => {
  let service: CompaniesService;
  let qb: ReturnType<typeof createQueryBuilderMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getRepositoryToken(Company), useValue: mockCompanyRepo },
        {
          provide: getRepositoryToken(CompanyMember),
          useValue: mockCompanyMemberRepo,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    jest.clearAllMocks();

    qb = createQueryBuilderMock();
    mockCompanyRepo.createQueryBuilder.mockReturnValue(qb);
  });

  describe('findAll', () => {
    it('should return paginated companies with default page and limit', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockCompany], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should filter by search keyword on name and description', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockCompany], 1]);

      await service.findAll({ search: 'Nomad' });

      expect(qb.andWhere).toHaveBeenCalled();
    });

    it('should filter by location', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockCompany], 1]);

      const result = await service.findAll({ location: 'Paris' });

      expect(result.data).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'company.location ILIKE :location',
        { location: '%Paris%' },
      );
    });

    it('should filter by industry', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockCompany], 1]);

      const result = await service.findAll({ industry: 'Business Service' });

      expect(result.data).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith(
        'company.industry ILIKE :industry',
        { industry: '%Business Service%' },
      );
    });

    it('should calculate hasNextPage correctly', async () => {
      const companies = Array.from({ length: 12 }, (_, i) => ({
        ...mockCompany,
        id: `uuid-${i}`,
      }));
      qb.getManyAndCount.mockResolvedValue([companies, 30]);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('should return empty data when no companies match filters', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ search: 'nonexistent' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.totalItems).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a company with its members', async () => {
      mockCompanyRepo.findOne.mockResolvedValue({
        ...mockCompany,
        members: [],
      });

      const result = await service.findOne('uuid-company-1');

      expect(result.id).toBe('uuid-company-1');
      expect(result).toHaveProperty('members');
    });

    it('should throw NotFoundException when company does not exist', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the company', async () => {
      mockCompanyRepo.findOne
        .mockResolvedValueOnce({ ...mockCompany, members: [] })
        .mockResolvedValueOnce({ ...mockCompany, name: 'Nomad Updated' });
      mockCompanyRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('uuid-company-1', {
        name: 'Nomad Updated',
      });

      expect(result!.name).toBe('Nomad Updated');
    });

    it('should throw NotFoundException when updating a non-existent company', async () => {
      mockCompanyRepo.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
