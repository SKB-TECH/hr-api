import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { sendResult, sendPaginated } from '@/helpers/message/sendResult';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.companiesService.create(dto, user.id);
    return sendResult(HttpStatus.CREATED, 'Company created', data);
  }

  @Get()
  @ApiOperation({
    summary: 'Browse companies with search, filter and pagination',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of companies' })
  async findAll(@Query() query: QueryCompanyDto) {
    const result = await this.companiesService.findAll(query);
    return sendPaginated(HttpStatus.OK, 'Companies fetched', result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single company profile' })
  @ApiResponse({ status: 200, description: 'Company profile returned' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.companiesService.findOne(id);
    return sendResult(HttpStatus.OK, 'Company fetched', data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update company settings' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const data = await this.companiesService.update(id, updateCompanyDto);
    return sendResult(HttpStatus.OK, 'Company updated', data);
  }
}
