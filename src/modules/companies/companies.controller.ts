import { Controller, Get, Post, Body, UseGuards, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

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
  create(@Body() dto: CreateCompanyDto, @CurrentUser() user: { id: string }) {
    return this.companiesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Browse companies with search, filter and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of companies' })
  findAll(@Query() query: QueryCompanyDto) {
    return this.companiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single company profile' })
  @ApiResponse({ status: 200, description: 'Company profile returned' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update company settings' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }
}
