import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { sendResult } from '@/helpers/message/sendResult';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UserRole } from '@/utils/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const companyRoles = [UserRole.COMPANY_OWNER, UserRole.HR_MANAGER, UserRole.RECRUITER, UserRole.ADMIN] as const;

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...companyRoles)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpis')
  async getCompanyKpis(@Query() query: AnalyticsQueryDto, @CurrentUser() user: { id: string }) {
    const data = await this.analyticsService.getCompanyKpis(query, user.id);
    return sendResult(HttpStatus.OK, 'KPIs fetched', data);
  }

  @Get('applications-chart')
  async getApplicationsChart(@Query() query: AnalyticsQueryDto, @CurrentUser() user: { id: string }) {
    const data = await this.analyticsService.getApplicationsChart(query, user.id);
    return sendResult(HttpStatus.OK, 'Applications chart fetched', data);
  }

  @Get('pipeline')
  async getPipelineFunnel(@Query() query: AnalyticsQueryDto, @CurrentUser() user: { id: string }) {
    const data = await this.analyticsService.getPipelineFunnel(query, user.id);
    return sendResult(HttpStatus.OK, 'Pipeline funnel fetched', data);
  }
}
