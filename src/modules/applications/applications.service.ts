import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service'; // Adjust path if needed
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import { UpdateApplicationStageDto } from './dto/update-application-stage.dto';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateApplicationDto, candidateId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, deletedAt: null },
      include: { company: { include: { pipelineStages: { orderBy: { order: 'asc' }, take: 1 } } } }
    });
    
    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.prisma.application.findUnique({
      where: { jobId_candidateId: { jobId: dto.jobId, candidateId } },
    });
    
    if (existing)
      throw new ConflictException('You have already applied to this job');

    // Automatically assign the applicant to the very first stage of the company's pipeline
    const initialStageId = job.company?.pipelineStages?.[0]?.id || null;

    const application = await this.prisma.application.create({
      data: { 
        ...dto, 
        candidateId,
        stageId: initialStageId 
      },
    });

    await this.prisma.job.update({
      where: { id: dto.jobId },
      data: { applicationsCount: { increment: 1 } },
    });

    return application;
  }

  async findMyApplications(candidateId: string, query: QueryApplicationDto) {
    // Assuming query.status was updated to query.stageId in your DTO!
    const { stageId, page = 1, limit = 10 } = query as any; 
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      candidateId,
      ...(stageId && { stageId }),
    };

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          stage: { select: { id: true, name: true } }, // NEW: Fetching dynamic stage
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
      
      // NEW: Since stages are dynamic, we look for any stage containing "Interview"
      this.prisma.application.count({
        where: { 
          candidateId, 
          stage: { name: { contains: 'Interview', mode: 'insensitive' } } 
        },
      }),
      
      this.prisma.application.findMany({
        where: { candidateId },
        orderBy: { appliedAt: 'desc' },
        take: 3,
        select: {
          id: true,
          stage: { select: { id: true, name: true } }, // NEW
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

    // Grouping by dynamic stage IDs
    const stageCounts = await this.prisma.application.groupBy({
      by: ['stageId'],
      where: { candidateId },
      _count: { stageId: true },
    });

    // Fetch the actual names of those stages so the frontend can render a beautiful chart
    const stageIds = stageCounts.map(s => s.stageId).filter(id => id !== null) as string[];
    const stages = await this.prisma.pipelineStage.findMany({
      where: { id: { in: stageIds } }
    });

    return {
      totalApplied: total,
      interviewed,
      statusBreakdown: stageCounts.map((s) => {
        const foundStage = stages.find(st => st.id === s.stageId);
        return {
          stageId: s.stageId,
          stageName: foundStage?.name || 'Unassigned',
          count: s._count.stageId,
        };
      }),
      recentApplications: recent,
    };
  }

  async findByJob(jobId: string, query: QueryApplicationDto) {
    const { stageId, search, page = 1, limit = 10 } = query as any;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      jobId,
      ...(stageId && { stageId }),
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
          stage: { select: { id: true, name: true } }, // NEW
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

    return { data, meta: { totalItems, totalPages, currentPage: page, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } };
  }

  async findByCompany(companyId: string, query: QueryApplicationDto) {
    const { stageId, search, page = 1, limit = 10 } = query as any;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      job: { companyId },
      ...(stageId && { stageId }),
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
          stage: { select: { id: true, name: true } }, // NEW
          score: true,
          appliedAt: true,
          job: { select: { id: true, title: true } },
        },
      }),
      this.prisma.application.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return { data, meta: { totalItems, totalPages, currentPage: page, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } };
  }

  async findOne(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        stage: true, // NEW: Include the stage so we can log history
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

  async updateStage(
    id: string,
    dto: UpdateApplicationStageDto,
    changedById: string,
  ) {
    // 1. Fetch current application to get the OLD stage name
    const application = await this.findOne(id);

    // 2. Fetch the newly requested stage to get the NEW stage name
    const newStage = await this.prisma.pipelineStage.findUnique({
      where: { id: dto.stageId }
    });
    if (!newStage) throw new NotFoundException('Pipeline stage not found');

    // 3. Execute the transaction using the new schema fields!
    return this.prisma.$transaction([
      this.prisma.application.update({
        where: { id },
        data: { stageId: dto.stageId },
      }),
      this.prisma.applicationStageHistory.create({
        data: {
          applicationId: id,
          oldStageName: application.stage?.name || 'Applied', // String!
          newStageName: newStage.name,                        // String!
          changedById,
          note: dto.note,
        },
      }),
    ]);
  }

  async updateScore(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.application.update({
      where: { id },
      data: { score: dto.score },
    });
  }

  async getStageHistory(id: string) {
    await this.findOne(id);
    return this.prisma.applicationStageHistory.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: 'desc' },
      include: { changedBy: { select: { fullName: true } } } // Added the HR manager's name for a better UI!
    });
  }
}
