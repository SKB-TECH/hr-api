import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Body,
  Patch,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AiServiceGuard } from './ai-service.guard';
import { AiIntegrationService } from './ai-integration.service';
import { SearchAiCandidatesDto } from './dto/search-ai-candidates.dto';
import { UpdateResumeParsingStatusDto } from './dto/update-resume-parsing-status.dto';
import { Response } from 'express';
import {
  AiCandidateSnapshotDto,
  AiJobContextDto,
  AiResumeStatusDto,
} from './dto/ai-integration-response.dto';

@ApiTags('Internal AI Integration')
@ApiSecurity('ai-service-token')
@UseGuards(AiServiceGuard)
@Controller('internal/ai')
export class AiIntegrationController {
  constructor(private readonly service: AiIntegrationService) {}
  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get a minimized job context for the trusted AI service',
  })
  @ApiHeader({ name: 'x-company-id', required: true })
  @ApiOkResponse({ type: AiJobContextDto })
  job(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Headers('x-company-id') companyId: string,
  ) {
    return this.service.jobContext(jobId, this.companyId(companyId));
  }
  @Get('jobs/:jobId/candidates')
  @ApiOperation({ summary: 'Get applicants for a job, scoped to its company' })
  @ApiHeader({ name: 'x-company-id', required: true })
  @ApiOkResponse({ type: [AiCandidateSnapshotDto] })
  candidates(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Headers('x-company-id') companyId: string,
  ) {
    return this.service.candidatePool(jobId, this.companyId(companyId));
  }

  @Post('jobs/:jobId/search-candidates')
  @ApiOperation({
    summary:
      'Filter recruiter-visible candidates using structured criteria only',
  })
  @ApiHeader({ name: 'x-company-id', required: true })
  @ApiOkResponse({ type: [AiCandidateSnapshotDto] })
  searchCandidates(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Headers('x-company-id') companyId: string,
    @Body() criteria: SearchAiCandidatesDto,
  ) {
    return this.service.searchCandidates(
      jobId,
      this.companyId(companyId),
      criteria,
    );
  }

  @Get('resumes/:resumeId/content')
  @ApiOperation({
    summary: 'Stream resume bytes to the trusted AI service only',
  })
  @ApiProduces(
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  )
  @ApiOkResponse({ description: 'Binary PDF or DOCX stream; never cached.' })
  async resumeContent(
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.service.resumeContent(resumeId);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    );
    response.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(file.buffer);
  }

  @Patch('resumes/:resumeId/parsing-status')
  @ApiOperation({
    summary: 'Update the auditable CV parsing lifecycle status',
  })
  @ApiOkResponse({ type: AiResumeStatusDto })
  updateResumeStatus(
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Body() dto: UpdateResumeParsingStatusDto,
  ) {
    return this.service.updateResumeParsingStatus(
      resumeId,
      dto.status,
      dto.error,
    );
  }

  private companyId(value: string): string {
    if (!isUUID(value, '4'))
      throw new BadRequestException('x-company-id must be a UUID v4');
    return value;
  }
}
