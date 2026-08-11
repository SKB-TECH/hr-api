import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { JobLevel, JobStatus } from '../../../utils/enums';
import { Job } from './entities/job.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';
import { QueryJobDto, JobSortOption } from './dto/query-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobSkillRequirement } from '../../../utils/enums';
import { JobSkill } from './entities/job-skill.entity';
import { JobRequirement } from './entities/job-requirement.entity';
import { JobBenefit } from './entities/job-benefit.entity';
import { Skill } from '../candidate/candidate-skill/entities/skill.entity';
import { PaginationDto, paginate } from '../../../helpers/pagination';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(CompanyMember)
    private readonly companyMemberRepo: Repository<CompanyMember>,
  ) {}

  async findAll(query: QueryJobDto = {}) {
    const {
      keyword,
      location,
      employmentType,
      category,
      jobLevel,
      salaryMin,
      salaryMax,
      sort = JobSortOption.MOST_RELEVANT,
      page = 1,
      limit = 10,
      companyId,
    } = query;

    const qb = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .where('job.status = :status', { status: JobStatus.LIVE })
      .andWhere("company.status = 'active'")
      .andWhere('(job.applyBefore IS NULL OR job.applyBefore > now())');

    if (keyword)
      qb.andWhere(
        new Brackets((sub) =>
          sub
            .where('job.title ILIKE :keyword', { keyword: `%${keyword}%` })
            .orWhere('job.description ILIKE :keyword', {
              keyword: `%${keyword}%`,
            })
            .orWhere('company.name ILIKE :keyword', {
              keyword: `%${keyword}%`,
            }),
        ),
      );
    if (location)
      qb.andWhere('job.location ILIKE :location', {
        location: `%${location}%`,
      });
    if (employmentType?.length)
      qb.andWhere(
        `(job.employmentType IN (:...employmentType) OR EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(job.employmentTypes) type(value)
          WHERE type.value IN (:...employmentType)
        ))`,
        { employmentType },
      );
    if (companyId) qb.andWhere('job.companyId = :companyId', { companyId });
    if (category?.length)
      qb.andWhere('job.category IN (:...category)', { category });
    if (jobLevel?.length)
      qb.andWhere('job.jobLevel IN (:...jobLevel)', { jobLevel });
    if (salaryMin !== undefined)
      qb.andWhere('job.salaryMin >= :salaryMin', { salaryMin });
    if (salaryMax !== undefined)
      qb.andWhere('job.salaryMax <= :salaryMax', { salaryMax });

    const [orderField, orderDir] = this.buildOrderBy(sort);
    qb.orderBy(`job.${orderField}`, orderDir);

    return paginate(qb, { page, limit } as PaginationDto);
  }

  async findOne(id: string) {
    const job = await this.jobRepo.findOne({
      where: { id, status: JobStatus.LIVE },
      relations: {
        company: true,
        skills: { skill: { category: true } },
        benefits: true,
        requirements: true,
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.company.status !== 'active')
      throw new NotFoundException('Job not found');
    return job;
  }

  async findMyCompanyJob(jobId: string, userId: string) {
    const membership = await this.membership(userId);
    const job = await this.jobRepo.findOne({
      where: { id: jobId, companyId: membership.companyId },
      relations: {
        company: true,
        skills: { skill: { category: true } },
        benefits: true,
        requirements: true,
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  private buildOrderBy(sort: JobSortOption): [string, 'ASC' | 'DESC'] {
    switch (sort) {
      case JobSortOption.NEWEST:
        return ['postedAt', 'DESC'];
      case JobSortOption.SALARY_HIGH:
        return ['salaryMax', 'DESC'];
      case JobSortOption.SALARY_LOW:
        return ['salaryMin', 'ASC'];
      default:
        return ['postedAt', 'DESC'];
    }
  }

  async createJob(createJobDto: CreateJobDto, userId: string) {
    const companyMember = await this.membership(userId);

    const {
      skillIds,
      requiredSkillIds,
      niceToHaveSkillIds,
      hardRequiredSkillIds,
      employmentTypes,
      employmentType,
      jobTitle,
      minSalary,
      maxSalary,
      jobDescription,
      niceToHave,
      skills: skillNames,
      benefits,
      requirements,
      ...jobData
    } = createJobDto;

    const salaryMin = jobData.salaryMin ?? minSalary;
    const salaryMax = jobData.salaryMax ?? maxSalary;
    this.validateSalary(salaryMin, salaryMax);
    const resolvedSkillIds = await this.resolveSkillNames(skillNames);
    const normalizedEmploymentTypes = [
      ...new Set(employmentTypes?.length ? employmentTypes : [employmentType!]),
    ];

    const skillRequirements = this.buildSkillRequirements(
      skillIds,
      [...(requiredSkillIds ?? []), ...resolvedSkillIds],
      niceToHaveSkillIds,
      hardRequiredSkillIds,
    );

    const job = this.jobRepo.create({
      ...jobData,
      title: jobData.title ?? jobTitle!,
      description: jobData.description ?? jobDescription!,
      niceToHaves: jobData.niceToHaves ?? niceToHave,
      salaryMin,
      salaryMax,
      jobLevel: jobData.jobLevel ?? JobLevel.MID_LEVEL,
      location: jobData.location ?? companyMember.company?.location ?? 'Remote',
      employmentType: normalizedEmploymentTypes[0],
      employmentTypes: normalizedEmploymentTypes,
      companyId: companyMember.companyId,
      createdBy: userId,
      status: JobStatus.DRAFT,
      ...(skillRequirements.size > 0
        ? {
            skills: [...skillRequirements].map(([skillId, requirement]) => ({
              skillId,
              ...requirement,
            })),
          }
        : {}),
      benefits: benefits?.map(({ title, description, icon }) => ({
        title,
        description,
        icon,
      })),
      requirements,
    });

    const saved = await this.jobRepo.save(job);

    const newJob = await this.jobRepo.findOne({
      where: { id: saved.id },
      relations: {
        skills: { skill: true },
        benefits: true,
        requirements: true,
        company: true,
      },
    });

    return {
      message: 'Job created successfully',
      data: newJob,
    };
  }

  async findMyCompanyJobs(userId: string, query: QueryJobDto) {
    const companyMember = await this.membership(userId);
    const { page = 1, limit = 10 } = query;
    const qb = this.jobRepo
      .createQueryBuilder('job')
      .where('job.companyId = :companyId', {
        companyId: companyMember.companyId,
      });
    if (query.keyword)
      qb.andWhere('job.title ILIKE :keyword', {
        keyword: `%${query.keyword}%`,
      });
    if (query.status?.length)
      qb.andWhere('job.status IN (:...statuses)', { statuses: query.status });
    if (query.employmentType?.length)
      qb.andWhere(
        `(job.employmentType IN (:...employmentTypes) OR EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(job.employmentTypes) type(value)
          WHERE type.value IN (:...employmentTypes)
        ))`,
        { employmentTypes: query.employmentType },
      );
    if (query.dateFrom)
      qb.andWhere('job.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo)
      qb.andWhere("job.createdAt < (:dateTo::date + interval '1 day')", {
        dateTo: query.dateTo,
      });
    qb.orderBy('job.createdAt', 'DESC');
    return paginate(qb, { page, limit } as PaginationDto);
  }

  async updateJob(jobId: string, userId: string, updateJobDto: UpdateJobDto) {
    const companyMember = await this.companyMemberRepo.findOne({
      where: { userId },
    });
    if (!companyMember)
      throw new NotFoundException('You are not associated with a company.');

    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found.');

    if (job.companyId !== companyMember.companyId) {
      throw new ForbiddenException(
        'You do not have permission to edit this job.',
      );
    }

    const {
      skillIds,
      requiredSkillIds,
      niceToHaveSkillIds,
      hardRequiredSkillIds,
      requirements,
      benefits,
      employmentTypes,
      employmentType,
      status,
      jobTitle,
      minSalary,
      maxSalary,
      jobDescription,
      niceToHave,
      skills: skillNames,
      ...scalarData
    } = updateJobDto;
    if (jobTitle !== undefined) scalarData.title = jobTitle;
    if (jobDescription !== undefined) scalarData.description = jobDescription;
    if (niceToHave !== undefined) scalarData.niceToHaves = niceToHave;
    if (minSalary !== undefined) scalarData.salaryMin = minSalary;
    if (maxSalary !== undefined) scalarData.salaryMax = maxSalary;
    const resolvedSkillIds = await this.resolveSkillNames(skillNames);
    this.validateSalary(
      scalarData.salaryMin ?? job.salaryMin ?? undefined,
      scalarData.salaryMax ?? job.salaryMax ?? undefined,
    );
    if (employmentType || employmentTypes?.length) {
      const normalized = [
        ...new Set(
          employmentTypes?.length ? employmentTypes : [employmentType!],
        ),
      ];
      Object.assign(scalarData, {
        employmentType: normalized[0],
        employmentTypes: normalized,
      });
    }
    const updatesSkills =
      skillIds !== undefined ||
      requiredSkillIds !== undefined ||
      niceToHaveSkillIds !== undefined ||
      hardRequiredSkillIds !== undefined;
    const updatesSkillsByName = skillNames !== undefined;

    await this.jobRepo.manager.transaction(async (manager) => {
      if (Object.keys(scalarData).length)
        await manager.getRepository(Job).update(jobId, scalarData as any);
      if (updatesSkills || updatesSkillsByName) {
        const repo = manager.getRepository(JobSkill);
        await repo.delete({ jobId });
        const values = [
          ...this.buildSkillRequirements(
            skillIds,
            [...(requiredSkillIds ?? []), ...resolvedSkillIds],
            niceToHaveSkillIds,
            hardRequiredSkillIds,
          ),
        ].map(([skillId, requirement]) =>
          repo.create({ jobId, skillId, ...requirement }),
        );
        if (values.length) await repo.save(values);
      }
      if (requirements !== undefined) {
        const repo = manager.getRepository(JobRequirement);
        await repo.delete({ jobId });
        if (requirements.length)
          await repo.save(
            requirements.map((requirement) =>
              repo.create({ jobId, ...requirement }),
            ),
          );
      }
      if (benefits !== undefined) {
        const repo = manager.getRepository(JobBenefit);
        await repo.delete({ jobId });
        if (benefits.length)
          await repo.save(
            benefits.map(({ title, description, icon }) =>
              repo.create({ jobId, title, description, icon }),
            ),
          );
      }
    });
    if (status === JobStatus.LIVE) await this.publishJob(jobId, userId);
    if (status === JobStatus.CLOSED) await this.closeJob(jobId, userId);
    const updatedJob = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: {
        skills: { skill: true },
        requirements: true,
        benefits: true,
      },
    });

    return {
      message: 'Job updated successfully',
      data: updatedJob,
    };
  }

  async deleteJob(jobId: string, userId: string) {
    return this.closeJob(jobId, userId);
  }

  async publishJob(jobId: string, userId: string) {
    const job = await this.ownedJob(jobId, userId, true);
    if (job.status === JobStatus.CLOSED)
      throw new BadRequestException(
        'Closed jobs must be reopened before publishing',
      );
    if (
      !job.title ||
      !job.description ||
      !job.responsibilities ||
      !job.whoYouAre
    )
      throw new BadRequestException('Job profile is incomplete');
    if (
      !job.skills?.some(
        (skill) => skill.requirementType === JobSkillRequirement.REQUIRED,
      )
    )
      throw new BadRequestException('At least one required skill is needed');
    if (job.applyBefore && job.applyBefore.getTime() <= Date.now())
      throw new BadRequestException(
        'Application deadline must be in the future',
      );
    await this.jobRepo.update(jobId, {
      status: JobStatus.LIVE,
      postedAt: job.postedAt ?? new Date(),
      closedAt: null,
      deletedAt: null,
    });
    return { jobId, status: JobStatus.LIVE };
  }

  async closeJob(jobId: string, userId: string) {
    await this.ownedJob(jobId, userId);
    await this.jobRepo.update(jobId, {
      status: JobStatus.CLOSED,
      closedAt: new Date(),
    });
    return { jobId, status: JobStatus.CLOSED };
  }

  async reopenJob(jobId: string, userId: string) {
    const job = await this.ownedJob(jobId, userId);
    if (job.status !== JobStatus.CLOSED)
      throw new BadRequestException('Only closed jobs can be reopened');
    await this.jobRepo.update(jobId, {
      status: JobStatus.DRAFT,
      closedAt: null,
      deletedAt: null,
    });
    return { jobId, status: JobStatus.DRAFT };
  }

  async duplicateJob(jobId: string, userId: string) {
    const source = await this.ownedJob(jobId, userId, true);
    const copy = this.jobRepo.create();
    Object.assign(copy, {
      ...source,
      id: undefined,
      title: `${source.title} (Copy)`,
      status: JobStatus.DRAFT,
      postedAt: null,
      closedAt: null,
      applicationsCount: 0,
      createdBy: userId,
      skills: source.skills?.map((item) => ({
        skillId: item.skillId,
        requirementType: item.requirementType,
        isHardRequirement: item.isHardRequirement,
      })),
      benefits: source.benefits?.map(({ title, description, icon }) => ({
        title,
        description,
        icon,
      })),
      requirements: source.requirements?.map(
        ({ type, value, isRequired, isHardRequirement }) => ({
          type,
          value,
          isRequired,
          isHardRequirement,
        }),
      ),
    });
    const saved = await this.jobRepo.save(copy);
    return this.findMyCompanyJob(saved.id, userId);
  }

  async companyStats(userId: string) {
    const membership = await this.membership(userId);
    const rows = await this.jobRepo
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .addSelect('COALESCE(SUM(job.applicationsCount), 0)::int', 'applications')
      .where('job.companyId = :companyId', { companyId: membership.companyId })
      .groupBy('job.status')
      .getRawMany();
    const statuses = Object.fromEntries(
      Object.values(JobStatus).map((status) => [status, 0]),
    );
    let applications = 0;
    for (const row of rows) {
      statuses[row.status] = Number(row.count);
      applications += Number(row.applications);
    }
    return {
      total: Object.values(statuses).reduce((a, b) => a + b, 0),
      statuses,
      applications,
    };
  }

  private async membership(userId: string) {
    const membership = await this.companyMemberRepo.findOne({
      where: { userId },
      relations: { company: true },
    });
    if (!membership)
      throw new NotFoundException('You are not associated with a company.');
    return membership;
  }

  private async ownedJob(jobId: string, userId: string, relations = false) {
    const membership = await this.membership(userId);
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: relations
        ? { skills: true, benefits: true, requirements: true }
        : undefined,
    });
    if (!job) throw new NotFoundException('Job not found.');
    if (job.companyId !== membership.companyId)
      throw new ForbiddenException(
        'You do not have permission to manage this job.',
      );
    return job;
  }

  private validateSalary(min?: number, max?: number) {
    if (min !== undefined && max !== undefined && min > max)
      throw new BadRequestException('salaryMin cannot exceed salaryMax');
  }

  private async resolveSkillNames(names?: string[]) {
    if (!names?.length) return [];
    const normalized = [
      ...new Set(names.map((name) => name.trim().toLowerCase())),
    ];
    const skills = await this.jobRepo.manager
      .getRepository(Skill)
      .createQueryBuilder('skill')
      .where('LOWER(skill.name) IN (:...names)', { names: normalized })
      .getMany();
    const found = new Map(
      skills.map((skill) => [skill.name.toLowerCase(), skill.id]),
    );
    const missing = normalized.filter((name) => !found.has(name));
    if (missing.length)
      throw new BadRequestException(`Unknown skills: ${missing.join(', ')}`);
    return normalized.map((name) => found.get(name)!);
  }

  private buildSkillRequirements(
    legacy: string[] | undefined,
    required: string[] | undefined,
    optional: string[] | undefined,
    hard: string[] | undefined,
  ) {
    const result = new Map<
      string,
      { requirementType: JobSkillRequirement; isHardRequirement: boolean }
    >();
    for (const id of optional ?? [])
      result.set(id, {
        requirementType: JobSkillRequirement.NICE_TO_HAVE,
        isHardRequirement: false,
      });
    for (const id of [...(legacy ?? []), ...(required ?? [])])
      result.set(id, {
        requirementType: JobSkillRequirement.REQUIRED,
        isHardRequirement: false,
      });
    for (const id of hard ?? [])
      result.set(id, {
        requirementType: JobSkillRequirement.REQUIRED,
        isHardRequirement: true,
      });
    return result;
  }
}
