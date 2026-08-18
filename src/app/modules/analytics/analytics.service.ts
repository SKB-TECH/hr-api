import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Application } from '../applications/entities/application.entity';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { CompanyMember } from '../companies/entities/company-member.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(CompanyMember)
    private readonly companyMemberRepo: Repository<CompanyMember>,
  ) {}

  async getCompanyKpis(query: AnalyticsQueryDto, userId: string) {
    const { companyId, startDate, endDate } = query;
    await this.assertCompanyAccess(companyId, userId);

    const jobQb = this.jobRepo.createQueryBuilder('j');
    if (companyId) jobQb.andWhere('j.companyId = :companyId', { companyId });
    if (startDate)
      jobQb.andWhere('j.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    if (endDate)
      jobQb.andWhere('j.createdAt <= :endDate', { endDate: new Date(endDate) });

    const appQb = this.appRepo.createQueryBuilder('a').leftJoin('a.job', 'j');
    if (companyId) appQb.andWhere('j.companyId = :companyId', { companyId });
    if (startDate)
      appQb.andWhere('a.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    if (endDate)
      appQb.andWhere('a.createdAt <= :endDate', { endDate: new Date(endDate) });

    const hiredQb = this.appRepo
      .createQueryBuilder('a')
      .leftJoin('a.job', 'j')
      .leftJoin('a.stage', 's')
      .where('s.name ILIKE :n', { n: 'Hired' });
    if (companyId) hiredQb.andWhere('j.companyId = :companyId', { companyId });
    if (startDate)
      hiredQb.andWhere('a.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    if (endDate)
      hiredQb.andWhere('a.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });

    const [totalJobs, totalApplicants, hiredApplicants] = await Promise.all([
      jobQb.getCount(),
      appQb.getCount(),
      hiredQb.getCount(),
    ]);

    return { totalJobsActive: totalJobs, totalApplicants, hiredCandidates: hiredApplicants };
  }

  async getApplicationsChart(query: AnalyticsQueryDto, userId: string) {
    const { companyId, startDate, endDate } = query;
    await this.assertCompanyAccess(companyId, userId);

    const appQb = this.appRepo
      .createQueryBuilder('a')
      .leftJoin('a.job', 'j')
      .select(['a.id', 'a.createdAt'])
      .orderBy('a.createdAt', 'ASC');
    if (companyId) appQb.andWhere('j.companyId = :companyId', { companyId });
    if (startDate)
      appQb.andWhere('a.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    if (endDate)
      appQb.andWhere('a.createdAt <= :endDate', { endDate: new Date(endDate) });

    const applications = await appQb.getMany();

    const groupedData = applications.reduce(
      (acc, app) => {
        const dateStr = app.createdAt.toISOString().split('T')[0];
        if (!acc[dateStr]) acc[dateStr] = 0;
        acc[dateStr]++;
        return acc;
      },
      {} as Record<string, number>,
    );

    const formattedChartData = Object.keys(groupedData).map((date) => ({
      date,
      applications: groupedData[date],
    }));

    return formattedChartData;
  }

  async getPipelineFunnel(query: AnalyticsQueryDto, userId: string) {
    const { companyId, startDate, endDate } = query;
    await this.assertCompanyAccess(companyId, userId);

    const qb = this.appRepo
      .createQueryBuilder('a')
      .leftJoin('a.job', 'j')
      .leftJoin('a.stage', 's')
      .select('s.name', 'name')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.name');
    if (companyId) qb.andWhere('j.companyId = :companyId', { companyId });
    if (startDate)
      qb.andWhere('a.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    if (endDate)
      qb.andWhere('a.createdAt <= :endDate', { endDate: new Date(endDate) });

    const rows = await qb.getRawMany<{ name: string | null; count: string }>();

    const formattedFunnel = rows.map((row) => ({
      status: String(row.name),
      count: Number(row.count),
    }));

    return formattedFunnel;
  }

  private async assertCompanyAccess(companyId: string | undefined, userId: string) {
    if (!companyId) throw new BadRequestException('companyId is required');
    const member = await this.companyMemberRepo.findOne({ where: { companyId, userId }, select: { id: true } });
    if (!member) throw new ForbiddenException('You cannot access analytics outside your company');
  }
}
