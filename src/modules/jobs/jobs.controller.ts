import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { QueryJobDto } from './dto/query-job.dto';
import { CreateJobDto } from './dto/create-job.dto'; 
import { UpdateJobDto } from './dto/update-job.dto';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter all live jobs (screens 1.2, 2.4, 2.5)' })
  @ApiResponse({ status: 200, description: 'Paginated job list returned' })
  findAll(@Query() query: QueryJobDto) {
    return this.jobsService.findAll(query);
  }

  // ==================================================
  // Charles : Company Dashboard Job Listing
  // MUST BE ABOVE @Get(':id')!
  // ==================================================
  @Get('company/me')
  @ApiOperation({ summary: 'Get all jobs posted by my company (Screen 3.9)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of company jobs (Draft, Live, Closed)' })
  // @UseGuards(JwtAuthGuard)
  findMyCompanyJobs(@Query() query: QueryJobDto, @Req() req: any) {
    // Fake UUID for testing until auth is plugged in
    const userId = req?.user?.id || '123e4567-e89b-12d3-a456-426614174000';
    return this.jobsService.findMyCompanyJobs(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full job details (screens 1.5, 2.6)' })
  @ApiResponse({ status: 200, description: 'Job details returned' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findOne(id);
  }

  // ==================================================
  // Charles : Create Job Endpoint
  // ==================================================
  @Post()
  @ApiOperation({ summary: 'Post a new job (screens 3.15, 3.16, 3.17)' })
  @ApiResponse({ status: 201, description: 'Job successfully created as DRAFT' })
  // @UseGuards(JwtAuthGuard) // Uncomment when ready to require real login tokens
  createJob(@Body() createJobDto: CreateJobDto, @Req() req: any) {
    // For testing without an active auth token, we use a fake fallback UUID
    const userId = req?.user?.id || '123e4567-e89b-12d3-a456-426614174000';
    
    return this.jobsService.createJob(createJobDto, userId);
  }

// ==================================================
  // Charles : Update Job Endpoint
  // ==================================================
  @Patch(':id')
  @ApiOperation({ summary: 'Update a job or publish it (Screen 3.16)' })
  @ApiResponse({ status: 200, description: 'Job successfully updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Job belongs to another company' })
  // @UseGuards(JwtAuthGuard)
  updateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateJobDto: UpdateJobDto,
    @Req() req: any,
  ) {
    const userId = req?.user?.id || '123e4567-e89b-12d3-a456-426614174000';
    return this.jobsService.updateJob(id, userId, updateJobDto);
  }

  // ==================================================
  // Charles : Delete Job Endpoint
  // ==================================================
  @Delete(':id')
  @ApiOperation({ summary: 'Delete/Close a job listing' })
  @ApiResponse({ status: 200, description: 'Job successfully deleted' })
  // @UseGuards(JwtAuthGuard)
  deleteJob(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const userId = req?.user?.id || '123e4567-e89b-12d3-a456-426614174000';
    return this.jobsService.deleteJob(id, userId);
  }
}