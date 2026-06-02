import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string) {
    // Use a transaction to ensure both records are created safely
    return this.prisma.$transaction(async (prisma) => {
      
      // 1. Create the Company profile
      const company = await prisma.company.create({
        data: createCompanyDto,
      });

      // 2. Link the User as the COMPANY_OWNER
      await prisma.companyMember.create({
        data: {
          userId: userId,
          companyId: company.id,
          role: 'COMPANY_OWNER',
        },
      });

      return company;
    });
  }

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }
// --- NEW: Fetch Company Profile ---
  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { members: true }, // Includes the team members for the frontend
    });
    
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  // --- NEW: Update Company Settings ---
  async update(id: string, updateCompanyDto: UpdateCompanyDto) { // Using 'any' briefly to avoid DTO import errors while we rush
    await this.findOne(id); // Verify it exists first
    
    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }
}