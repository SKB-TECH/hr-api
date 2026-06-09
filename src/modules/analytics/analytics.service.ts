import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service'; // Adjust path if needed
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // ENDPOINT A: Top KPI Cards
  // ==========================================
  async getCompanyKpis(query: AnalyticsQueryDto) {
    const { companyId, startDate, endDate } = query;

    // 1. Build the dynamic date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // 2. Build the where clauses
    const jobWhere: any = { companyId };
    if (startDate || endDate) jobWhere.createdAt = dateFilter;

    const applicationWhere: any = { job: { companyId } };
    if (startDate || endDate) applicationWhere.createdAt = dateFilter;

    // 3. Run all count queries in parallel for maximum speed
    const [totalJobs, totalApplicants, hiredApplicants] = await this.prisma.$transaction([
      this.prisma.job.count({ where: jobWhere }),
      this.prisma.application.count({ where: applicationWhere }),
      this.prisma.application.count({
        where: { ...applicationWhere, status: 'HIRED' }, // Adjust 'HIRED' to match your enum
      }),
    ]);

    return {
      success: true,
      data: {
        totalJobsActive: totalJobs,
        totalApplicants: totalApplicants,
        hiredCandidates: hiredApplicants,
        trends: {
          applicantsTrend: '+12%', // Hardcoded for now, can be dynamic later
          hiredTrend: '+2%'
        }
      }
    };
  }

  // ==========================================
  // ENDPOINT B: Applications Over Time (Chart)
  // ==========================================
  async getApplicationsChart(query: AnalyticsQueryDto) {
    const { companyId, startDate, endDate } = query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const applicationsWhere: any = { job: { companyId } };
    if (startDate || endDate) applicationsWhere.createdAt = dateFilter;

    // Fetch ONLY timestamps to keep the query blazing fast
    const applications = await this.prisma.application.findMany({
      where: applicationsWhere,
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group timestamps by day (YYYY-MM-DD)
    const groupedData = applications.reduce((acc, app) => {
      const dateStr = app.createdAt.toISOString().split('T')[0];
      if (!acc[dateStr]) acc[dateStr] = 0;
      acc[dateStr]++;
      return acc;
    }, {} as Record<string, number>);

    // Format into a clean array for Recharts/Chart.js: [{ date: '2026-06-01', applications: 5 }]
    const formattedChartData = Object.keys(groupedData).map((date) => ({
      date,
      applications: groupedData[date],
    }));

    return {
      success: true,
      data: formattedChartData,
    };
  }

  // ==========================================
  // ENDPOINT C: Pipeline Funnel (Status Distribution)
  // ==========================================
  async getPipelineFunnel(query: AnalyticsQueryDto) {
    const { companyId, startDate, endDate } = query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const applicationWhere: any = { job: { companyId } };
    if (startDate || endDate) applicationWhere.createdAt = dateFilter;

    // Use a simple, type-safe aggregation: fetch statuses then count in JS
    // Typecast select to any to avoid strict generated Prisma types mismatch
    const statuses = await this.prisma.application.findMany({
      where: applicationWhere as any,
      select: ({ status: true } as any),
    });

    const counts: Record<string, number> = {};
    for (const s of statuses) {
      const key = String((s as any).status);
      counts[key] = (counts[key] || 0) + 1;
    }

    // Format for frontend: [{ status: 'APPLIED', count: 50 }, ...]
    const formattedFunnel = Object.keys(counts).map((status) => ({
      status,
      count: counts[status],
    }));

    return {
      success: true,
      data: formattedFunnel,
    };
  }
}
