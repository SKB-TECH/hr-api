import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CompanyMember } from './entities/company-member.entity';
import { CompanyTeamMember } from './entities/company-team-member.entity';
import { User } from '../users/entities/user.entity';
import { CompanyInvitation } from './entities/company-invitation.entity';
import { MailService } from '../../../libs/mail/mail.service';
import { ConfigService } from '../../../libs/env/config.service';
import { StorageService } from '../../../libs/storage/storage.service';

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
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

const mockTeamMemberRepo = {
  findOne: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn((value) => value),
  remove: jest.fn(),
};

const mockUserRepo = { findOne: jest.fn(), update: jest.fn() };
const mockInvitationRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn((value) => value),
};
const mockMail = { sendCompanyInvitation: jest.fn() };
const mockConfig = { get: jest.fn(() => 'http://localhost:3000') };
const mockStorage = {
  uploadImage: jest.fn(),
  deleteByUrl: jest.fn(),
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
        {
          provide: getRepositoryToken(CompanyTeamMember),
          useValue: mockTeamMemberRepo,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        {
          provide: getRepositoryToken(CompanyInvitation),
          useValue: mockInvitationRepo,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: MailService, useValue: mockMail },
        { provide: ConfigService, useValue: mockConfig },
        { provide: StorageService, useValue: mockStorage },
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
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
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
        expect.stringContaining('jsonb_array_elements_text'),
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

    it('should calculate pagination meta correctly', async () => {
      const companies = Array.from({ length: 12 }, (_, i) => ({
        ...mockCompany,
        id: `uuid-${i}`,
      }));
      qb.getManyAndCount.mockResolvedValue([companies, 30]);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.meta.total).toBe(30);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(12);
    });

    it('should return empty data when no companies match filters', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ search: 'nonexistent' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a public company with its profile team', async () => {
      mockCompanyRepo.findOne.mockResolvedValue({
        ...mockCompany,
        teamMembers: [],
      });

      const result = await service.findOne('uuid-company-1');

      expect(result.id).toBe('uuid-company-1');
      expect(result).toHaveProperty('teamMembers');
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
      mockCompanyMemberRepo.findOne.mockResolvedValue({
        companyId: 'uuid-company-1',
        userId: 'owner-1',
        role: 'COMPANY_OWNER',
      });
      mockCompanyRepo.findOne.mockResolvedValueOnce({
        ...mockCompany,
        name: 'Nomad Updated',
      });
      mockCompanyRepo.update.mockResolvedValue({ affected: 1 });

      const result = await service.update('uuid-company-1', 'owner-1', {
        name: 'Nomad Updated',
      });

      expect(result!.name).toBe('Nomad Updated');
    });

    it('should reject updates from a non-member', async () => {
      mockCompanyMemberRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('uuid-company-1', 'outsider', { name: 'X' }),
      ).rejects.toThrow('Company access denied');
    });
  });

  describe('members and invitations', () => {
    it('creates a pending invitation without exposing its raw token', async () => {
      mockCompanyMemberRepo.findOne.mockResolvedValue({
        companyId: 'uuid-company-1',
        userId: 'owner-1',
        role: 'COMPANY_OWNER',
      });
      mockUserRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'owner-1', fullName: 'Owner' });
      mockInvitationRepo.findOne.mockResolvedValue(null);
      mockCompanyRepo.findOne.mockResolvedValue(mockCompany);
      mockInvitationRepo.save.mockImplementation(async (value) => ({
        ...value,
        id: 'invitation-1',
      }));

      const result = await service.addMember('uuid-company-1', 'owner-1', {
        email: 'new@example.com',
        fullName: 'New Recruiter',
        role: 'RECRUITER',
      });

      expect(result).toMatchObject({
        id: 'invitation-1',
        email: 'new@example.com',
        status: 'pending',
      });
      expect(result).not.toHaveProperty('token');
      expect(mockMail.sendCompanyInvitation).toHaveBeenCalled();
    });

    it('never allows changing the owner membership role', async () => {
      mockCompanyMemberRepo.findOne
        .mockResolvedValueOnce({ role: 'COMPANY_OWNER' })
        .mockResolvedValueOnce({
          id: 'owner-membership',
          companyId: 'uuid-company-1',
          role: 'COMPANY_OWNER',
        });
      await expect(
        service.updateMember('uuid-company-1', 'owner-membership', 'owner-1', {
          role: 'RECRUITER',
        }),
      ).rejects.toThrow('Company owner role cannot be changed');
    });
  });

  describe('lifecycle', () => {
    it('schedules deletion with a 30-day recovery date for the owner', async () => {
      mockCompanyMemberRepo.findOne.mockResolvedValue({
        companyId: 'uuid-company-1',
        userId: 'owner-1',
        role: 'COMPANY_OWNER',
      });
      const result = await service.scheduleDeletion(
        'uuid-company-1',
        'owner-1',
        'No longer needed',
      );
      expect(result.status).toBe('deletion_scheduled');
      expect(result.deletionScheduledAt.getTime()).toBeGreaterThan(Date.now());
      expect(mockCompanyRepo.update).toHaveBeenCalledWith(
        'uuid-company-1',
        expect.objectContaining({ status: 'deletion_scheduled' }),
      );
    });
  });
});
