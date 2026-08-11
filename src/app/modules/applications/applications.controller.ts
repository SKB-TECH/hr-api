import {
  Body,
  Controller,
  Get,
  HttpStatus,
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
import { UpdateApplicationStageDto } from './dto/update-application-stage.dto';
import { UpdateApplicationScoreDto } from './dto/update-application-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { sendResult, sendPaginated } from '@/helpers/message/sendResult';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UserRole } from '../../../utils/enums';

const recruiterRoles = [
  UserRole.COMPANY_OWNER,
  UserRole.HR_MANAGER,
  UserRole.RECRUITER,
  UserRole.ADMIN,
] as const;

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Submit a job application (screen 1.9)' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  @ApiResponse({ status: 409, description: 'Already applied to this job' })
  async create(
    @Body() dto: CreateApplicationDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.applicationsService.create(dto, user.id);
    return sendResult(HttpStatus.CREATED, 'Application submitted', data);
  }

  @Get('my')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Get my application history (screen 2.3)' })
  async findMyApplications(
    @CurrentUser() user: { id: string },
    @Query() query: QueryApplicationDto,
  ) {
    const result = await this.applicationsService.findMyApplications(
      user.id,
      query,
    );
    return sendPaginated(HttpStatus.OK, 'Applications fetched', result);
  }

  @Get('my/stats')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Get applicant dashboard stats (screen 2.1)' })
  async getMyStats(@CurrentUser() user: { id: string }) {
    const data = await this.applicationsService.getMyStats(user.id);
    return sendResult(HttpStatus.OK, 'Application stats fetched', data);
  }

  @Get('job/:jobId')
  @Roles(...recruiterRoles)
  @ApiOperation({ summary: 'Get applicants for a job (screens 3.10, 3.11)' })
  async findByJob(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Query() query: QueryApplicationDto,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.applicationsService.findByJob(
      jobId,
      query,
      user.id,
    );
    return sendPaginated(HttpStatus.OK, 'Applications fetched', result);
  }

  @Get('company/:companyId')
  @Roles(...recruiterRoles)
  @ApiOperation({ summary: 'Get all applicants for a company (screen 3.4)' })
  async findByCompany(
    @Param('companyId') companyId: string,
    @Query() query: QueryApplicationDto,
    @CurrentUser() user: { id: string },
  ) {
    const result = await this.applicationsService.findByCompany(
      companyId,
      query,
      user.id,
    );
    return sendPaginated(HttpStatus.OK, 'Applications fetched', result);
  }

  @Get(':id')
  @Roles(...recruiterRoles)
  @ApiOperation({ summary: 'Get a single application detail (screen 3.5)' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.applicationsService.findOne(id, user.id);
    return sendResult(HttpStatus.OK, 'Application fetched', data);
  }

  @Patch(':id/stage')
  @Roles(...recruiterRoles)
  @ApiOperation({ summary: 'Update hiring stage (screen 3.7)' })
  async updateStage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStageDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.applicationsService.updateStage(id, dto, user.id);
    return sendResult(HttpStatus.OK, 'Stage updated', data);
  }

  @Get(':id/history')
  @Roles(...recruiterRoles)
  @ApiOperation({ summary: 'Get stage change history with notes (screen 3.7)' })
  async getStageHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.applicationsService.getStageHistory(id, user.id);
    return sendResult(HttpStatus.OK, 'Stage history fetched', data);
  }

  @Patch(':id/score')
  @Roles(...recruiterRoles)
  @ApiOperation({ summary: 'Give applicant a rating (screen 3.7)' })
  async updateScore(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationScoreDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.applicationsService.updateScore(id, dto, user.id);
    return sendResult(HttpStatus.OK, 'Application score updated', data);
  }
}
