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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { QueryJobDto } from './dto/query-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { sendResult, sendPaginated } from '@/helpers/message/sendResult';

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
  @ApiOperation({ summary: 'Get all jobs posted by my company (Screen 3.9)' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of company jobs (Draft, Live, Closed)',
  })
  async findMyCompanyJobs(@Query() query: QueryJobDto, @Req() req: any) {
    const userId = req?.user?.id || '123e4567-e89b-12d3-a456-426614174000';
    const result = await this.jobsService.findMyCompanyJobs(userId, query);
    return sendPaginated(HttpStatus.OK, 'Company jobs fetched', result);
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
  @ApiOperation({ summary: 'Post a new job (screens 3.15, 3.16, 3.17)' })
  @ApiResponse({
    status: 201,
    description: 'Job successfully created as DRAFT',
  })
  async createJob(@Body() createJobDto: CreateJobDto, @Req() req: any) {
    const userId = req?.user?.id || '123e4567-e89b-12d3-a456-426614174000';

    const data = await this.jobsService.createJob(createJobDto, userId);
    return sendResult(HttpStatus.CREATED, 'Job created', data);
  }

  @Patch(':id')
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
    const userId = req?.user?.id || '123e4567-e89b-12d3-a456-426614174000';
    const data = await this.jobsService.updateJob(id, userId, updateJobDto);
    return sendResult(HttpStatus.OK, 'Job updated', data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete/Close a job listing' })
  @ApiResponse({ status: 200, description: 'Job successfully deleted' })
  async deleteJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const userId = req?.user?.id || '123e4567-e89b-12d3-a456-426614174000';
    const data = await this.jobsService.deleteJob(id, userId);
    return sendResult(HttpStatus.OK, 'Job deleted', data);
  }
}
