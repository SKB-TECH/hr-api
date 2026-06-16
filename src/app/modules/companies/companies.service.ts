import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { Company } from './entities/company.entity';
import { CompanyMember } from './entities/company-member.entity';
import { PaginationDto, paginate } from '../../../helpers/pagination';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyMember)
    private readonly companyMemberRepo: Repository<CompanyMember>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const companyRepo = manager.getRepository(Company);
      const memberRepo = manager.getRepository(CompanyMember);

      const company = await companyRepo.save(
        companyRepo.create(createCompanyDto),
      );

      await memberRepo.save(
        memberRepo.create({
          userId,
          companyId: company.id,
          role: 'COMPANY_OWNER',
        }),
      );

      return company;
    });
  }

  async findAll(query: QueryCompanyDto = {}) {
    const {
      search,
      location,
      industry,
      companySize,
      page = 1,
      limit = 12,
    } = query;

    const qb = this.companyRepo.createQueryBuilder('company');

    if (search) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('company.name ILIKE :search', {
            search: `%${search}%`,
          }).orWhere('company.description ILIKE :search', {
            search: `%${search}%`,
          });
        }),
      );
    }

    if (location) {
      qb.andWhere('company.location ILIKE :location', {
        location: `%${location}%`,
      });
    }

    if (industry) {
      qb.andWhere('company.industry ILIKE :industry', {
        industry: `%${industry}%`,
      });
    }

    if (companySize) {
      qb.andWhere('company.companySize = :companySize', { companySize });
    }

    qb.orderBy('company.createdAt', 'DESC');

    return paginate(qb, { page, limit } as PaginationDto);
  }

  async findOne(id: string) {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: { members: true },
    });

    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findOne(id);

    await this.companyRepo.update(id, updateCompanyDto);
    return this.companyRepo.findOne({ where: { id } });
  }
}
