import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobStatus } from '../../../utils/enums';
import { Job } from './entities/job.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';
import { QueryJobDto, JobSortOption } from './dto/query-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobSkillRequirement } from '../../../utils/enums';
import { JobSkill } from './entities/job-skill.entity';
import { JobRequirement } from './entities/job-requirement.entity';
import {
  PaginationDto,
  createPaginatedResult,
  paginate,
} from '../../../helpers/pagination';

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
    } = query;

    const qb = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .where('job.status = :status', { status: JobStatus.LIVE });

    if (keyword)
      qb.andWhere('job.title ILIKE :keyword', { keyword: `%${keyword}%` });
    if (location)
      qb.andWhere('job.location ILIKE :location', {
        location: `%${location}%`,
      });
    if (employmentType?.length)
      qb.andWhere('job.employmentType IN (:...employmentType)', {
        employmentType,
      });
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
      where: { id },
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
    const companyMember = await this.companyMemberRepo.findOne({
      where: { userId },
    });

    if (!companyMember) {
      throw new NotFoundException(
        'You must be assigned to a company to post a job.',
      );
    }

    const {
      skillIds,
      requiredSkillIds,
      niceToHaveSkillIds,
      hardRequiredSkillIds,
      ...jobData
    } = createJobDto;

    const skillRequirements = this.buildSkillRequirements(
      skillIds,
      requiredSkillIds,
      niceToHaveSkillIds,
      hardRequiredSkillIds,
    );

    const job = this.jobRepo.create({
      ...jobData,
      companyId: companyMember.companyId,
      status: JobStatus.DRAFT,
      ...(skillRequirements.size > 0
        ? {
            skills: [...skillRequirements].map(([skillId, requirement]) => ({
              skillId,
              ...requirement,
            })),
          }
        : {}),
    });

    const saved = await this.jobRepo.save(job);

    const newJob = await this.jobRepo.findOne({
      where: { id: saved.id },
      relations: {
        skills: { skill: true },
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
    const companyMember = await this.companyMemberRepo.findOne({
      where: { userId },
    });

    if (!companyMember) {
      throw new NotFoundException('You are not associated with any company.');
    }

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const statusFilter = (query as any).status;

    const where: any = {
      companyId: companyMember.companyId,
      ...(statusFilter && { status: statusFilter }),
    };

    const [data, total] = await this.jobRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return createPaginatedResult(data, total, page, limit);
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
      ...scalarData
    } = updateJobDto;
    const updatesSkills =
      skillIds !== undefined ||
      requiredSkillIds !== undefined ||
      niceToHaveSkillIds !== undefined ||
      hardRequiredSkillIds !== undefined;

    await this.jobRepo.manager.transaction(async (manager) => {
      if (Object.keys(scalarData).length)
        await manager.getRepository(Job).update(jobId, scalarData as any);
      if (updatesSkills) {
        const repo = manager.getRepository(JobSkill);
        await repo.delete({ jobId });
        const values = [
          ...this.buildSkillRequirements(
            skillIds,
            requiredSkillIds,
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
    });
    const updatedJob = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: {
        skills: { skill: true },
        requirements: true,
      },
    });

    return {
      message: 'Job updated successfully',
      data: updatedJob,
    };
  }

  async deleteJob(jobId: string, userId: string) {
    const companyMember = await this.companyMemberRepo.findOne({
      where: { userId },
    });
    if (!companyMember)
      throw new NotFoundException('You are not associated with a company.');

    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found.');

    if (job.companyId !== companyMember.companyId) {
      throw new ForbiddenException(
        'You do not have permission to delete this job.',
      );
    }

    await this.jobRepo.update(jobId, {
      status: JobStatus.CLOSED,
      deletedAt: new Date(),
    });

    return {
      message: 'Job successfully removed',
    };
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
