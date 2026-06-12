import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CompanyMember } from './entities/company-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, CompanyMember])],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
