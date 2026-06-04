import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, JobStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { QueryJobDto, JobSortOption } from './dto/query-job.dto';

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const skip = (page - 1) * limit;

    const where: Prisma.JobWhereInput = {
      status: JobStatus.LIVE,
      deletedAt: null,
      ...(keyword && {
        title: { contains: keyword, mode: 'insensitive' },
      }),
      ...(location && {
        location: { contains: location, mode: 'insensitive' },
      }),
      ...(employmentType?.length && { employmentType: { in: employmentType } }),
      ...(category?.length && { category: { in: category } }),
      ...(jobLevel?.length && { jobLevel: { in: jobLevel } }),
      ...((salaryMin !== undefined || salaryMax !== undefined) && {
        salaryMin: {
          ...(salaryMin !== undefined && { gte: salaryMin }),
        },
        ...(salaryMax !== undefined && {
          salaryMax: { lte: salaryMax },
        }),
      }),
    };

    const orderBy = this.buildOrderBy(sort);

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          location: true,
          employmentType: true,
          jobLevel: true,
          category: true,
          salaryMin: true,
          salaryMax: true,
          salaryCurrency: true,
          applicationsCount: true,
          capacity: true,
          applyBefore: true,
          postedAt: true,
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              location: true,
            },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      meta: {
        totalItems,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findFirst({
      where: { id, deletedAt: null },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
            location: true,
            website: true,
            coverImage: true,
          },
        },
        skills: { select: { id: true, name: true } },
        benefits: { select: { id: true, title: true, description: true } },
      },
    });

    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  private buildOrderBy(
    sort: JobSortOption,
  ): Prisma.JobOrderByWithRelationInput {
    switch (sort) {
      case JobSortOption.NEWEST:
        return { postedAt: 'desc' };
      case JobSortOption.SALARY_HIGH:
        return { salaryMax: 'desc' };
      case JobSortOption.SALARY_LOW:
        return { salaryMin: 'asc' };
      default:
        return { postedAt: 'desc' };
    }
  }
}
