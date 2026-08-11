import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { QueryJobDto } from './dto/query-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { sendResult, sendPaginated } from '@/helpers/message/sendResult';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UserRole } from '../../../utils/enums';

const recruiterRoles = [
  UserRole.COMPANY_OWNER,
  UserRole.HR_MANAGER,
  UserRole.RECRUITER,
  UserRole.ADMIN,
] as const;

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({
    summary: 'Search and filter all live jobs (screens 1.2, 2.4, 2.5)',
  })
  @ApiResponse({ status: 200, description: 'Paginated job list returned' })
  async findAll(@Query() query: QueryJobDto) {
    const result = await this.jobsService.findAll(query);
    return sendPaginated(HttpStatus.OK, 'Jobs fetched', result);
  }

  @Get('company/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all jobs posted by my company (Screen 3.9)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of company jobs (Draft, Live, Closed)',
  })
  async findMyCompanyJobs(@Query() query: QueryJobDto, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.jobsService.findMyCompanyJobs(userId, query);
    return sendPaginated(HttpStatus.OK, 'Company jobs fetched', result);
  }

  @Get('company/me/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get job and application totals for my company' })
  async companyStats(@Req() req: any) {
    return sendResult(
      HttpStatus.OK,
      'Company job statistics fetched',
      await this.jobsService.companyStats(req.user.id),
    );
  }

  @Get('company/me/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a draft, live or closed job owned by my company',
  })
  async findMyCompanyJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company job fetched',
      await this.jobsService.findMyCompanyJob(id, req.user.id),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full job details (screens 1.5, 2.6)' })
  @ApiResponse({ status: 200, description: 'Job details returned' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.jobsService.findOne(id);
    return sendResult(HttpStatus.OK, 'Job fetched', data);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a new job (screens 3.15, 3.16, 3.17)' })
  @ApiResponse({
    status: 201,
    description: 'Job successfully created as DRAFT',
  })
  async createJob(@Body() createJobDto: CreateJobDto, @Req() req: any) {
    const userId = req.user.id;

    const data = await this.jobsService.createJob(createJobDto, userId);
    return sendResult(HttpStatus.CREATED, 'Job created', data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a job or publish it (Screen 3.16)' })
  @ApiResponse({ status: 200, description: 'Job successfully updated' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Job belongs to another company',
  })
  async updateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateJobDto: UpdateJobDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const data = await this.jobsService.updateJob(id, userId, updateJobDto);
    return sendResult(HttpStatus.OK, 'Job updated', data);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate and publish a draft job' })
  async publishJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return sendResult(
      HttpStatus.OK,
      'Job published',
      await this.jobsService.publishJob(id, req.user.id),
    );
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Close a job while preserving it in company history',
  })
  async closeJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return sendResult(
      HttpStatus.OK,
      'Job closed',
      await this.jobsService.closeJob(id, req.user.id),
    );
  }

  @Post(':id/reopen')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reopen a closed job as a draft for review' })
  async reopenJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return sendResult(
      HttpStatus.OK,
      'Job reopened as draft',
      await this.jobsService.reopenJob(id, req.user.id),
    );
  }

  @Post(':id/duplicate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Duplicate a company job as a new draft' })
  async duplicateJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return sendResult(
      HttpStatus.CREATED,
      'Job duplicated',
      await this.jobsService.duplicateJob(id, req.user.id),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...recruiterRoles)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Legacy alias for closing a job listing' })
  @ApiResponse({ status: 200, description: 'Job successfully closed' })
  async deleteJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const userId = req.user.id;
    const data = await this.jobsService.deleteJob(id, userId);
    return sendResult(HttpStatus.OK, 'Job deleted', data);
  }
}
