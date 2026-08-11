import {
  Body,
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { UserRole } from '@/utils/enums';
import { AiClientService } from './ai-client.service';
import { AiIntegrationService } from './ai-integration.service';
import { RunRecruiterWorkflowDto } from './dto/run-recruiter-workflow.dto';
import { Throttle } from '@nestjs/throttler';
import { AiOperationCoordinator } from './ai-operation-coordinator.service';

@ApiTags('AI Recruiter')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.COMPANY_OWNER,
  UserRole.HR_MANAGER,
  UserRole.RECRUITER,
  UserRole.ADMIN,
)
@Throttle({
  short: { limit: 1, ttl: 1000 },
  long: { limit: 10, ttl: 60000 },
})
@Controller('ai/recruiter')
export class AiGatewayController {
  constructor(
    private readonly ai: AiClientService,
    private readonly integration: AiIntegrationService,
    private readonly operations: AiOperationCoordinator,
  ) {}

  @Post('jobs/:jobId/workflows')
  @ApiOperation({
    summary:
      'Run a company-scoped, multi-step recruiter workflow through hr-ia',
    description:
      'The API verifies job ownership before calling hr-ia. Scores are deterministic and every result requires human review.',
  })
  @ApiResponse({ status: 201, description: 'Evidence-based workflow result' })
  @ApiHeader({
    name: 'idempotency-key',
    required: true,
    description: 'Unique UUID v4 for this costly AI operation',
  })
  async runWorkflow(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: RunRecruiterWorkflowDto,
    @CurrentUser() user: { id: string },
    @Headers('x-request-id') requestId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const companyId = await this.integration.companyForRecruiter(
      jobId,
      user.id,
    );
    return this.operations.run(
      'workflow',
      user.id,
      jobId,
      idempotencyKey,
      () =>
        this.ai.post(
        '/api/v1/internal/ai/recruiter/workflows/job',
        { request: dto.request, jobId, companyId, limit: dto.limit },
        requestId || randomUUID(),
        ),
    );
  }

  @Post('jobs/:jobId/search')
  @ApiOperation({
    summary: 'Search recruiter-visible candidates from natural language',
    description:
      'hr-ia only interprets the request. Candidate filtering is executed by hr-api SQL and no candidate database is sent to OpenAI.',
  })
  @ApiHeader({
    name: 'idempotency-key',
    required: true,
    description: 'Unique UUID v4 for this AI search interpretation',
  })
  async search(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: RunRecruiterWorkflowDto,
    @CurrentUser() user: { id: string },
    @Headers('x-request-id') requestId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const companyId = await this.integration.companyForRecruiter(
      jobId,
      user.id,
    );
    return this.operations.run(
      'search',
      user.id,
      jobId,
      idempotencyKey,
      async () => {
        const criteria = await this.ai.post<{
        seniority?: string | null;
        requiredSkills?: string[];
        domainExperience?: string[];
        location?: string | null;
      }>(
        '/api/v1/internal/ai/recruiter/search/interpret',
        { request: dto.request },
        requestId || randomUUID(),
      );
        const candidates = await this.integration.searchCandidates(
          jobId,
          companyId,
          { ...criteria, limit: dto.limit },
        );
        return { criteria, candidates, requiresHumanReview: true };
      },
    );
  }
}
