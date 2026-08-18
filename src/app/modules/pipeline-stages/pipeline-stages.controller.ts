import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PipelineStagesService } from './pipeline-stages.service';
import { UpdatePipelineStagesDto } from './dto/update-pipeline-stages.dto';
import { sendResult } from '@/helpers/message/sendResult';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UserRole } from '@/utils/enums';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

const companyRoles = [
  UserRole.COMPANY_OWNER,
  UserRole.HR_MANAGER,
  UserRole.RECRUITER,
  UserRole.ADMIN,
] as const;

@ApiTags('Company Settings - Pipeline Stages')
@Controller('companies/:companyId/pipeline-stages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...companyRoles)
export class PipelineStagesController {
  constructor(private readonly pipelineStagesService: PipelineStagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all custom pipeline stages for a company' })
  @ApiParam({ name: 'companyId', description: 'UUID of the company' })
  async getStages(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.pipelineStagesService.getCompanyStages(
      companyId,
      user.id,
    );
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
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.pipelineStagesService.updateCompanyStages(
      companyId,
      dto,
      user.id,
    );
    return sendResult(HttpStatus.OK, 'Pipeline stages updated', data);
  }
}
