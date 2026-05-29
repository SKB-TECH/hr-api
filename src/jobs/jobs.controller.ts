import { Controller, Get, Param, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Charles's existing homepage endpoint
  @Get('latest')
  findLatest() {
    return this.jobsService.findAllLatest();
  }

  // NEW: All Jobs endpoint (GET /jobs?page=1&limit=2)
  @Get()
  findAll(
    @Query('page') page: string = '1', 
    @Query('limit') limit: string = '10'
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    
    return this.jobsService.findAll(pageNumber, limitNumber);
  }

  // NEW: Single Job endpoint (GET /jobs/:id)
  // WARNING: Must remain below 'latest' to prevent route collision!
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(parseInt(id, 10));
  }
}
