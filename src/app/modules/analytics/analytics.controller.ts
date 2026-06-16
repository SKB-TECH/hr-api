import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Analytics')
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  async getCompanyKpis(@Query() query: AnalyticsQueryDto) {
    const data = await this.analyticsService.getCompanyKpis(query);
    return sendResult(HttpStatus.OK, 'KPIs fetched', data);
  }

  @Get('applications-chart')
  async getApplicationsChart(@Query() query: AnalyticsQueryDto) {
    const data = await this.analyticsService.getApplicationsChart(query);
    return sendResult(HttpStatus.OK, 'Applications chart fetched', data);
  }

  @Get('pipeline')
  async getPipelineFunnel(@Query() query: AnalyticsQueryDto) {
    const data = await this.analyticsService.getPipelineFunnel(query);
    return sendResult(HttpStatus.OK, 'Pipeline funnel fetched', data);
  }
}
