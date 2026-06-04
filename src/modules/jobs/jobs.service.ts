import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, JobStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { QueryJobDto, JobSortOption } from './dto/query-job.dto';
import { CreateJobDto } from './dto/create-job.dto'; 
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  // ... [Esther's findAll logic maintained] ...
  async findAll(query: QueryJobDto = {}) {
    const {
      keyword, location, employmentType, category, jobLevel,
      salaryMin, salaryMax, sort = JobSortOption.MOST_RELEVANT,
      page = 1, limit = 10,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {
      status: JobStatus.LIVE,
      deletedAt: null,
      ...(keyword && { title: { contains: keyword, mode: 'insensitive' } }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(employmentType?.length && { employmentType: { in: employmentType } }),
      ...(category?.length && { category: { in: category } }),
      ...(jobLevel?.length && { jobLevel: { in: jobLevel } }),
      ...((salaryMin !== undefined || salaryMax !== undefined) && {
        salaryMin: { ...(salaryMin !== undefined && { gte: salaryMin }) },
        ...(salaryMax !== undefined && { salaryMax: { lte: salaryMax } }),
      }),
    };

    const orderBy = this.buildOrderBy(sort);

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where, skip, take: limit, orderBy,
        select: {
          id: true, title: true, location: true, employmentType: true,
          jobLevel: true, category: true, salaryMin: true, salaryMax: true,
          salaryCurrency: true, applicationsCount: true, capacity: true,
          applyBefore: true, postedAt: true,
          company: { select: { id: true, name: true, logo: true, location: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        totalItems, totalPages, currentPage: page,
        hasNextPage: page < totalPages, hasPreviousPage: page > 1,
      },
    };
  }

  // ... [Esther's findOne logic maintained] ...
  async findOne(id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: {
          select: {
            id: true, name: true, logo: true, description: true,
            location: true, website: true, coverImage: true,
          },
        },
        skills: { select: { id: true, name: true } },
        benefits: { select: { id: true, title: true, description: true } },
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  private buildOrderBy(sort: JobSortOption): Prisma.JobOrderByWithRelationInput {
    switch (sort) {
      case JobSortOption.NEWEST: return { postedAt: 'desc' };
      case JobSortOption.SALARY_HIGH: return { salaryMax: 'desc' };
      case JobSortOption.SALARY_LOW: return { salaryMin: 'asc' };
      default: return { postedAt: 'desc' };
    }
  }

  // ==================================================
  // Charles : Create Job (Company Dashboard)
  // ==================================================
  async createJob(createJobDto: CreateJobDto, userId: string) {
    // 1. Find the company the logged-in user belongs to
    const companyMember = await this.prisma.companyMember.findFirst({
      where: { userId: userId },
    });

    if (!companyMember) {
      throw new NotFoundException('You must be assigned to a company to post a job.');
    }

    // 2. Creates the job and link it to their company
    const newJob = await this.prisma.job.create({
      data: {
        ...createJobDto,
        companyId: companyMember.companyId,
        status: JobStatus.DRAFT, // Uses Prisma's native enum
      },
    });

    return {
      message: 'Job created successfully',
      data: newJob,
    };
  }

  // ==================================================
  // Charles : Get Company Jobs (Screen 3.9)
  // ==================================================
  async findMyCompanyJobs(userId: string, query: QueryJobDto) {
    // 1. Find the logged-in user's company
    const companyMember = await this.prisma.companyMember.findFirst({
      where: { userId: userId },
    });

    if (!companyMember) {
      throw new NotFoundException('You are not associated with any company.');
    }

    // 2. Extract pagination and optional status filter
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // 3. We use 'any' here temporarily if your DTO doesn't expose status yet, 
    // but the frontend will send ?status=LIVE or ?status=DRAFT
    const statusFilter = (query as any).status; 

    const where: Prisma.JobWhereInput = {
      companyId: companyMember.companyId,
      deletedAt: null, // Don't show soft-deleted jobs
      ...(statusFilter && { status: statusFilter }), 
    };

    // 4. Fetch the jobs and the total count for pagination
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // Newest jobs at the top of the dashboard
        select: {
          id: true,
          title: true,
          employmentType: true,
          location: true,
          status: true,
          applicationsCount: true,
          postedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  // ==================================================
  // Charles : Update Job (Edit Draft / Publish to Live)
  // ==================================================
  async updateJob(jobId: string, userId: string, updateJobDto: UpdateJobDto) {
    // 1. Get logged-in user's company
    const companyMember = await this.prisma.companyMember.findFirst({
      where: { userId: userId },
    });
    if (!companyMember) throw new NotFoundException('You are not associated with a company.');

    // 2. Fetch the job to ensure it exists
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) throw new NotFoundException('Job not found.');

    // 3. SECURITY CHECK: Does this job belong to their company?
    if (job.companyId !== companyMember.companyId) {
      throw new ForbiddenException('You do not have permission to edit this job.');
    }

    // 4. Update the job
    const updatedJob = await this.prisma.job.update({
      where: { id: jobId },
      data: updateJobDto,
    });

    return {
      message: 'Job updated successfully',
      data: updatedJob,
    };
  }

  // ==================================================
  // Charles : Delete Job (Soft Delete)
  // ==================================================
  async deleteJob(jobId: string, userId: string) {
    // 1. Get logged-in user's company
    const companyMember = await this.prisma.companyMember.findFirst({
      where: { userId: userId },
    });
    if (!companyMember) throw new NotFoundException('You are not associated with a company.');

    // 2. Fetch the job
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.deletedAt) throw new NotFoundException('Job not found.');

    // 3. SECURITY CHECK: Does this job belong to their company?
    if (job.companyId !== companyMember.companyId) {
      throw new ForbiddenException('You do not have permission to delete this job.');
    }

    // 4. Soft Delete: We don't erase it from the DB, we just set deletedAt and close it
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.CLOSED,
        deletedAt: new Date(),
      },
    });

    return {
      message: 'Job successfully removed',
    };
  }
}