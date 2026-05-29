import { Controller, Get, Param, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('latest')
  findLatest() {
    return this.jobsService.findAllLatest();
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.jobsService.findAll(parseInt(page, 10), parseInt(limit, 10));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(parseInt(id, 10));
  }
}
