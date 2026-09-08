import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { sendResult } from '@/helpers/message/sendResult';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search jobs, companies and public candidate profiles' })
  @ApiQuery({ name: 'q', required: true, minLength: 2 })
  @ApiQuery({ name: 'limit', required: false })
  async search(@Query('q') q = '', @Query('limit') limit?: string) {
    return sendResult(HttpStatus.OK, 'Search results', await this.service.search(q, Number(limit) || 6));
  }
}
