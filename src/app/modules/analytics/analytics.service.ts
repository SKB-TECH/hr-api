import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Application } from '../applications/entities/application.entity';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
  ) {}

  async getCompanyKpis(query: AnalyticsQueryDto) {
    const { companyId, startDate, endDate } = query;

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

    return {
      success: true,
      data: {
        totalJobsActive: totalJobs,
        totalApplicants: totalApplicants,
        hiredCandidates: hiredApplicants,
        trends: {
          applicantsTrend: '+12%', // Hardcoded for now, can be dynamic later
          hiredTrend: '+2%',
        },
      },
    };
  }

  async getApplicationsChart(query: AnalyticsQueryDto) {
    const { companyId, startDate, endDate } = query;

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

    return {
      success: true,
      data: formattedChartData,
    };
  }

  async getPipelineFunnel(query: AnalyticsQueryDto) {
    const { companyId, startDate, endDate } = query;

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

    return {
      success: true,
      data: formattedFunnel,
    };
  }
}
