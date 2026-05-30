import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  // 1. Create a new company
  async create(createCompanyDto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  // 2. Get a list of all companies
  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' } // Shows newest companies first
    });
  }
}