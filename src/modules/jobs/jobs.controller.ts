import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto, UpdateJobDto } from './dto/job.dto';
import { ApplyJobDto } from './dto/apply-job.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ApiResponse } from '../../common/response/api-response';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // ── PUBLIC ────────────────────────────────────────────────────────────────

  @Get(':id')
  async getJob(@Param('id') id: string) {
    const data = await this.jobsService.getById(id);
    return ApiResponse.ok(data);
  }

  @Post(':id/apply')
  @HttpCode(HttpStatus.CREATED)
  async applyForJob(@Param('id') id: string, @Body() dto: ApplyJobDto) {
    await this.jobsService.applyForJob(id, dto);
    return ApiResponse.created(null, 'Your application has been submitted successfully.');
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createJob(@Body() dto: CreateJobDto) {
    const data = await this.jobsService.createJob(dto);
    return ApiResponse.created(data, 'Job created successfully');
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  async updateJob(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    const data = await this.jobsService.updateJob(id, dto);
    return ApiResponse.ok(data, 'Job updated successfully');
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async deleteJob(@Param('id') id: string) {
    await this.jobsService.deleteJob(id);
    return ApiResponse.ok(null, 'Job deleted successfully');
  }
}
