import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  EmploymentType,
  JobLevel,
  JobCategory,
  JobStatus,
} from '../../../utils/enums';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';
import { JobSortOption } from './dto/query-job.dto';
import { JobSkill } from './entities/job-skill.entity';
import { JobRequirement } from './entities/job-requirement.entity';

const mockCompany = {
  id: 'uuid-company-1',
  name: 'Stripe',
  logo: 'https://cdn.example.com/stripe.png',
  location: 'Paris, France',
  status: 'active',
};

const mockJob = {
  id: 'uuid-job-1',
  companyId: 'uuid-company-1',
  title: 'Social Media Assistant',
  location: 'Paris, France',
  employmentType: EmploymentType.FULL_TIME,
  jobLevel: JobLevel.ENTRY_LEVEL,
  category: JobCategory.MARKETING,
  salaryMin: 700,
  salaryMax: 1000,
  salaryCurrency: 'USD',
  applicationsCount: 5,
  capacity: 10,
  applyBefore: new Date('2026-07-31'),
  postedAt: new Date('2026-07-01'),
  company: mockCompany,
};

const mockJobDetail = {
  ...mockJob,
  description: 'We are looking for a Social Media expert.',
  responsibilities: 'Manage social channels.',
  whoYouAre: 'You are passionate about social media.',
  niceToHaves: 'Experience with analytics tools.',
  status: JobStatus.LIVE,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  skills: [{ id: 'uuid-skill-1', name: 'Copywriting' }],
  benefits: [
    {
      id: 'uuid-benefit-1',
      title: 'Full Healthcare',
      description: 'We cover all healthcare.',
    },
  ],
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

const mockJobRepo = {
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
};

describe('JobsService', () => {
  let service: JobsService;
  let qb: ReturnType<typeof createQueryBuilderMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: mockJobRepo },
        {
          provide: getRepositoryToken(CompanyMember),
          useValue: mockCompanyMemberRepo,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    jest.clearAllMocks();

    qb = createQueryBuilderMock();
    mockJobRepo.createQueryBuilder.mockReturnValue(qb);
  });

  it('replaces structured skill and hard requirements transactionally', async () => {
    const skillRepo = {
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const requirementRepo = {
      delete: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((value) => value),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const entityManager = {
      getRepository: jest.fn((entity) => {
        if (entity === Job) return { update: jest.fn() };
        if (entity === JobSkill) return skillRepo;
        if (entity === JobRequirement) return requirementRepo;
      }),
    };
    const repo = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 'job', companyId: 'company' })
        .mockResolvedValueOnce({ id: 'job', companyId: 'company' }),
      manager: {
        transaction: jest.fn((callback) => callback(entityManager)),
      },
    } as any;
    const service = new JobsService(repo, {
      findOne: jest.fn().mockResolvedValue({ companyId: 'company' }),
    } as any);

    await service.updateJob('job', 'user', {
      hardRequiredSkillIds: ['skill'],
      requirements: [
        {
          type: 'license' as any,
          value: 'Medical license',
          isRequired: true,
          isHardRequirement: true,
        },
      ],
    });

    expect(skillRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({ skillId: 'skill', isHardRequirement: true }),
    ]);
    expect(requirementRepo.save).toHaveBeenCalledWith([
      expect.objectContaining({ value: 'Medical license' }),
    ]);
  });

  describe('findAll', () => {
    it('should return paginated jobs with default page and limit', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by keyword in job title', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ keyword: 'Social Media' });

      expect(result.data).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.objectContaining({ whereFactory: expect.any(Function) }),
      );
    });

    it('should filter by location', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ location: 'Paris' });

      expect(result.data).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith('job.location ILIKE :location', {
        location: '%Paris%',
      });
    });

    it('should filter by employment type', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({
        employmentType: [EmploymentType.FULL_TIME],
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by multiple employment types', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({
        employmentType: [EmploymentType.FULL_TIME, EmploymentType.REMOTE],
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by category', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({
        category: [JobCategory.MARKETING],
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by job level', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({
        jobLevel: [JobLevel.ENTRY_LEVEL],
      });

      expect(result.data).toHaveLength(1);
    });

    it('should filter by salary min', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ salaryMin: 700 });

      expect(result.data).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith('job.salaryMin >= :salaryMin', {
        salaryMin: 700,
      });
    });

    it('should filter by salary max', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ salaryMax: 3000 });

      expect(result.data).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith('job.salaryMax <= :salaryMax', {
        salaryMax: 3000,
      });
    });

    it('should filter by salary range (min and max)', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ salaryMin: 700, salaryMax: 3000 });

      expect(result.data).toHaveLength(1);
    });

    it('should sort by newest', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ sort: JobSortOption.NEWEST });

      expect(result.data).toHaveLength(1);
      expect(qb.orderBy).toHaveBeenCalledWith('job.postedAt', 'DESC');
    });

    it('should sort by salary high to low', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ sort: JobSortOption.SALARY_HIGH });

      expect(result.data).toHaveLength(1);
      expect(qb.orderBy).toHaveBeenCalledWith('job.salaryMax', 'DESC');
    });

    it('should sort by salary low to high', async () => {
      qb.getManyAndCount.mockResolvedValue([[mockJob], 1]);

      const result = await service.findAll({ sort: JobSortOption.SALARY_LOW });

      expect(result.data).toHaveLength(1);
      expect(qb.orderBy).toHaveBeenCalledWith('job.salaryMin', 'ASC');
    });

    it('should return correct pagination meta when more pages exist', async () => {
      const jobs = Array.from({ length: 10 }, (_, i) => ({
        ...mockJob,
        id: `uuid-job-${i}`,
      }));
      qb.getManyAndCount.mockResolvedValue([jobs, 73]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.total).toBe(73);
      expect(result.meta.totalPages).toBe(8);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });

    it('should return correct pagination meta on page 2', async () => {
      const jobs = Array.from({ length: 10 }, (_, i) => ({
        ...mockJob,
        id: `uuid-job-${i}`,
      }));
      qb.getManyAndCount.mockResolvedValue([jobs, 73]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.meta.total).toBe(73);
      expect(result.meta.totalPages).toBe(8);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
    });

    it('should return empty data when no jobs match filters', async () => {
      qb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ keyword: 'nonexistent-job-xyz' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a job with company, skills and benefits', async () => {
      mockJobRepo.findOne.mockResolvedValue(mockJobDetail);

      const result = await service.findOne('uuid-job-1');

      expect(result.id).toBe('uuid-job-1');
      expect(result.title).toBe('Social Media Assistant');
      expect(result.skills).toHaveLength(1);
      expect(result.benefits).toHaveLength(1);
      expect(result.company.name).toBe('Stripe');
    });

    it('should throw NotFoundException when job does not exist', async () => {
      mockJobRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for a deleted job', async () => {
      mockJobRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('uuid-deleted-job')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('job lifecycle', () => {
    it('publishes a complete draft and sets postedAt', async () => {
      mockCompanyMemberRepo.findOne.mockResolvedValue({
        companyId: 'uuid-company-1',
      });
      mockJobRepo.findOne.mockResolvedValue({
        ...mockJobDetail,
        status: JobStatus.DRAFT,
        postedAt: null,
        applyBefore: new Date(Date.now() + 86400000),
        skills: [
          {
            requirementType: 'required',
            isHardRequirement: false,
          },
        ],
      });

      await expect(service.publishJob('uuid-job-1', 'user-1')).resolves.toEqual(
        { jobId: 'uuid-job-1', status: JobStatus.LIVE },
      );
      expect(mockJobRepo.update).toHaveBeenCalledWith(
        'uuid-job-1',
        expect.objectContaining({
          status: JobStatus.LIVE,
          postedAt: expect.any(Date),
        }),
      );
    });

    it('allows publishing a complete draft without skills', async () => {
      mockCompanyMemberRepo.findOne.mockResolvedValue({
        companyId: 'uuid-company-1',
      });
      mockJobRepo.findOne.mockResolvedValue({
        ...mockJobDetail,
        status: JobStatus.DRAFT,
        applyBefore: new Date(Date.now() + 86400000),
        skills: [],
      });
      await expect(service.publishJob('uuid-job-1', 'user-1')).resolves.toEqual(
        { jobId: 'uuid-job-1', status: JobStatus.LIVE },
      );
    });

    it('closes without soft-deleting the job from company history', async () => {
      mockCompanyMemberRepo.findOne.mockResolvedValue({
        companyId: 'uuid-company-1',
      });
      mockJobRepo.findOne.mockResolvedValue(mockJobDetail);
      await service.closeJob('uuid-job-1', 'user-1');
      expect(mockJobRepo.update).toHaveBeenCalledWith(
        'uuid-job-1',
        expect.objectContaining({ status: JobStatus.CLOSED }),
      );
      const calls = mockJobRepo.update.mock.calls;
      const lastUpdate = calls[calls.length - 1][1];
      expect(lastUpdate).not.toHaveProperty('deletedAt');
    });

    it('rejects inverted salary ranges', async () => {
      mockCompanyMemberRepo.findOne.mockResolvedValue({
        companyId: 'uuid-company-1',
      });
      await expect(
        service.createJob(
          {
            title: 'Engineer',
            category: JobCategory.ENGINEERING,
            jobLevel: JobLevel.MID_LEVEL,
            employmentType: EmploymentType.FULL_TIME,
            location: 'Remote',
            salaryMin: 5000,
            salaryMax: 1000,
            description: 'Description',
            responsibilities: 'Responsibilities',
            whoYouAre: 'Qualifications',
          },
          'user-1',
        ),
      ).rejects.toThrow('salaryMin cannot exceed salaryMax');
    });
  });
});
