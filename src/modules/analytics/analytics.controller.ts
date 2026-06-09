import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

@ApiTags('Analytics')
// @UseGuards(JwtAuthGuard)
@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  getCompanyKpis(@Query() query: AnalyticsQueryDto) {
    // The query object is already validated by our DTO here!
    return this.analyticsService.getCompanyKpis(query);
  }

  @Get('applications-chart')
  getApplicationsChart(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getApplicationsChart(query);
  }

  @Get('pipeline')
  getPipelineFunnel(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPipelineFunnel(query);
  }
}
