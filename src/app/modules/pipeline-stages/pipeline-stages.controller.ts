import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PipelineStagesService } from './pipeline-stages.service';
import { UpdatePipelineStagesDto } from './dto/update-pipeline-stages.dto';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Company Settings - Pipeline Stages')
@Controller('api/v1/companies/:companyId/pipeline-stages')
export class PipelineStagesController {
  constructor(private readonly pipelineStagesService: PipelineStagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all custom pipeline stages for a company' })
  @ApiParam({ name: 'companyId', description: 'UUID of the company' })
  async getStages(@Param('companyId', ParseUUIDPipe) companyId: string) {
    const data = await this.pipelineStagesService.getCompanyStages(companyId);
    return sendResult(HttpStatus.OK, 'Pipeline stages fetched', data);
  }

  @Put()
  @ApiOperation({
    summary: 'Update, create, or delete pipeline stages (bulk sync)',
  })
  @ApiParam({ name: 'companyId', description: 'UUID of the company' })
  async updateStages(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: UpdatePipelineStagesDto,
  ) {
    const data = await this.pipelineStagesService.updateCompanyStages(
      companyId,
      dto,
    );
    return sendResult(HttpStatus.OK, 'Pipeline stages updated', data);
  }
}
