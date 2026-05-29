import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { JobsService } from '../jobs.service';
import { CreateJobDto } from '../dto/create-job.dto';
import { CreateApplicationDto } from '../dto/create-application.dto';

@Controller('api/v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async findAll() {
    const [data, total] = await this.jobsService.findAll();
    return { statusCode: 200, message: 'Jobs fetched successfully', data, meta: { total } };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.jobsService.findOne(id);
    return { statusCode: 200, message: 'Job details fetched successfully', data };
  }

  @Post()
  async create(@Body() createJobDto: CreateJobDto) {
    const data = await this.jobsService.create(createJobDto);
    return { statusCode: 201, message: 'Job created successfully', data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateJobDto: Partial<CreateJobDto>) {
    const data = await this.jobsService.update(id, updateJobDto);
    return { statusCode: 200, message: 'Job updated successfully', data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.jobsService.remove(id);
    return { statusCode: 200, message: 'Job deleted successfully' };
  }

  @Post(':id/apply')
  @HttpCode(HttpStatus.CREATED)
  async apply(@Param('id') id: string, @Body() dto: CreateApplicationDto) {
    const data = await this.jobsService.apply(id, dto);
    return { statusCode: 201, message: 'Application submitted successfully', data };
  }
}
