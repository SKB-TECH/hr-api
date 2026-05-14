import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { JobsService } from '../services/jobs.service';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobDto } from '../dto/update-job.dto';
import { QueryJobDto } from '../dto/query-job.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'The job has been successfully created.' })
  create(@Body() createJobDto: CreateJobDto, @UploadedFile() file: Express.Multer.File) {
    return this.jobsService.create(createJobDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs with pagination and filters' })
  findAll(@Query() query: QueryJobDto) {
    return this.jobsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job by ID' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a job by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.jobsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.jobsService.update(id, updateJobDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job' })
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
