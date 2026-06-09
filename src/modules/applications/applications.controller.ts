import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { QueryApplicationDto } from './dto/query-application.dto';
import {
  UpdateApplicationScoreDto,
  UpdateApplicationStageDto,
} from './dto/update-application-stage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a job application (screen 1.9)' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  @ApiResponse({ status: 409, description: 'Already applied to this job' })
  create(
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.applicationsService.create(dto, user.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my application history (screen 2.3)' })
  findMyApplications(
    @CurrentUser() user: { id: string },
    @Query() query: QueryApplicationDto,
  ) {
    return this.applicationsService.findMyApplications(user.id, query);
  }

  @Get('my/stats')
  @ApiOperation({ summary: 'Get applicant dashboard stats (screen 2.1)' })
  getMyStats(@CurrentUser() user: { id: string }) {
    return this.applicationsService.getMyStats(user.id);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get applicants for a job (screens 3.10, 3.11)' })
  findByJob(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() query: QueryApplicationDto,
  ) {
    return this.applicationsService.findByJob(jobId, query);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get all applicants for a company (screen 3.4)' })
  findByCompany(
    @Param('companyId') companyId: string,
    @Query() query: QueryApplicationDto,
  ) {
    return this.applicationsService.findByCompany(companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single application detail (screen 3.5)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id/stage')
  @ApiOperation({ summary: 'Update hiring stage (screen 3.7)' })
  updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.applicationsService.updateStage(id, dto, user.id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get stage change history with notes (screen 3.7)' })
  getStageHistory(@Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.getStageHistory(id);
  }

  @Patch(':id/score')
  @ApiOperation({ summary: 'Give applicant a rating (screen 3.7)' })
  updateScore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationScoreDto,
  ) {
    return this.applicationsService.updateScore(id, dto);
  }
}
