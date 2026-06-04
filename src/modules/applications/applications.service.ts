import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import {
  UpdateApplicationScoreDto,
  UpdateApplicationStageDto,
} from './dto/update-application-stage.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApplicationDto, candidateId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.prisma.application.findUnique({
      where: { jobId_candidateId: { jobId: dto.jobId, candidateId } },
    });
    if (existing)
      throw new ConflictException('You have already applied to this job');

    const application = await this.prisma.application.create({
      data: { ...dto, candidateId },
    });

    await this.prisma.job.update({
      where: { id: dto.jobId },
      data: { applicationsCount: { increment: 1 } },
    });

    return application;
  }

  async findMyApplications(candidateId: string, query: QueryApplicationDto) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      candidateId,
      ...(status && { status }),
    };

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          status: true,
          appliedAt: true,
          job: {
            select: {
              id: true,
              title: true,
              employmentType: true,
              company: { select: { id: true, name: true, logo: true } },
            },
          },
        },
      }),
      this.prisma.application.count({ where }),
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

  async getMyStats(candidateId: string) {
    const [total, interviewed, recent] = await this.prisma.$transaction([
      this.prisma.application.count({ where: { candidateId } }),
      this.prisma.application.count({
        where: { candidateId, status: 'INTERVIEWING' },
      }),
      this.prisma.application.findMany({
        where: { candidateId },
        orderBy: { appliedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          status: true,
          appliedAt: true,
          job: {
            select: {
              title: true,
              employmentType: true,
              company: { select: { name: true, logo: true, location: true } },
            },
          },
        },
      }),
    ]);

    const statusCounts = await this.prisma.application.groupBy({
      by: ['status'],
      where: { candidateId },
      _count: { status: true },
    });

    return {
      totalApplied: total,
      interviewed,
      statusBreakdown: statusCounts.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      recentApplications: recent,
    };
  }

  async findByJob(jobId: string, query: QueryApplicationDto) {
    const { status, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      jobId,
      ...(status && { status }),
      ...(search && {
        fullName: { contains: search, mode: 'insensitive' },
      }),
    };

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          score: true,
          appliedAt: true,
          job: { select: { title: true } },
          candidate: {
            select: {
              candidateProfile: { select: { headline: true } },
            },
          },
        },
      }),
      this.prisma.application.count({ where }),
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

  async findByCompany(companyId: string, query: QueryApplicationDto) {
    const { status, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      job: { companyId },
      ...(status && { status }),
      ...(search && {
        fullName: { contains: search, mode: 'insensitive' },
      }),
    };

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          status: true,
          score: true,
          appliedAt: true,
          job: { select: { id: true, title: true } },
        },
      }),
      this.prisma.application.count({ where }),
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
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            title: true,
            employmentType: true,
            category: true,
            company: { select: { id: true, name: true, logo: true } },
          },
        },
        interviews: true,
      },
    });

    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  async updateStage(id: string, dto: UpdateApplicationStageDto) {
    await this.findOne(id);
    return this.prisma.application.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async updateScore(id: string, dto: UpdateApplicationScoreDto) {
    await this.findOne(id);
    return this.prisma.application.update({
      where: { id },
      data: { score: dto.score },
    });
  }
}
