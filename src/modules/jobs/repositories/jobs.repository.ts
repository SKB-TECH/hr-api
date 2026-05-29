import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Prisma, Job, JobApplication } from '@prisma/client';

@Injectable()
export class JobsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.JobCreateInput): Promise<Job> {
    return this.prisma.job.create({ data });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.JobWhereInput;
    orderBy?: Prisma.JobOrderByWithRelationInput;
  }): Promise<[Job[], number]> {
    const { skip, take, where, orderBy } = params;
    return Promise.all([
      this.prisma.job.findMany({ skip, take, where, orderBy }),
      this.prisma.job.count({ where }),
    ]);
  }

  async findOne(where: Prisma.JobWhereUniqueInput): Promise<Job | null> {
    return this.prisma.job.findUnique({ where });
  }

  async update(params: {
    where: Prisma.JobWhereUniqueInput;
    data: Prisma.JobUpdateInput;
  }): Promise<Job> {
    return this.prisma.job.update({ where: params.where, data: params.data });
  }

  async remove(where: Prisma.JobWhereUniqueInput): Promise<Job> {
    return this.prisma.job.delete({ where });
  }

  async saveApplication(data: Prisma.JobApplicationUncheckedCreateInput): Promise<JobApplication> {
    return this.prisma.jobApplication.create({ data });
  }
}
