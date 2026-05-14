import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Prisma, HeroImage } from '@prisma/client';

@Injectable()
export class HeroRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.HeroImageCreateInput): Promise<HeroImage> {
    return this.prisma.heroImage.create({ data });
  }

  async findAll(): Promise<HeroImage[]> {
    return this.prisma.heroImage.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(where: Prisma.HeroImageWhereUniqueInput): Promise<HeroImage | null> {
    return this.prisma.heroImage.findUnique({ where });
  }

  async findActive(): Promise<HeroImage | null> {
    return this.prisma.heroImage.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(params: {
    where: Prisma.HeroImageWhereUniqueInput;
    data: Prisma.HeroImageUpdateInput;
  }): Promise<HeroImage> {
    return this.prisma.heroImage.update({ where: params.where, data: params.data });
  }

  async remove(where: Prisma.HeroImageWhereUniqueInput): Promise<HeroImage> {
    return this.prisma.heroImage.delete({ where });
  }
}
