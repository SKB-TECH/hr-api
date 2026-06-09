import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const company = await prisma.company.create({
        data: createCompanyDto,
      });

      await prisma.companyMember.create({
        data: {
          userId,
          companyId: company.id,
          role: 'COMPANY_OWNER',
        },
      });

      return company;
    });
  }

  async findAll(query: QueryCompanyDto = {}) {
    const { search, location, industry, companySize, page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(location && { location: { contains: location, mode: 'insensitive' } }),
      ...(industry && { industry: { contains: industry, mode: 'insensitive' } }),
      ...(companySize && { companySize }),
    };

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          description: true,
          industry: true,
          location: true,
          companySize: true,
          website: true,
          createdAt: true,
        },
      }),
      this.prisma.company.count({ where }),
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
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id);

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }
}
