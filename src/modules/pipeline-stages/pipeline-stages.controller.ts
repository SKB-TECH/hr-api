import { Controller, Get, Put, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PipelineStagesService } from './pipeline-stages.service';
import { UpdatePipelineStagesDto } from './dto/update-pipeline-stages.dto';

@ApiTags('Company Settings - Pipeline Stages')
@Controller('api/v1/companies/:companyId/pipeline-stages')
export class PipelineStagesController {
  constructor(private readonly pipelineStagesService: PipelineStagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all custom pipeline stages for a company' })
  @ApiParam({ name: 'companyId', description: 'UUID of the company' })
  getStages(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.pipelineStagesService.getCompanyStages(companyId);
  }

  @Put()
  @ApiOperation({ summary: 'Update, create, or delete pipeline stages (bulk sync)' })
  @ApiParam({ name: 'companyId', description: 'UUID of the company' })
  updateStages(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: UpdatePipelineStagesDto,
  ) {
    return this.pipelineStagesService.updateCompanyStages(companyId, dto);
  }
}