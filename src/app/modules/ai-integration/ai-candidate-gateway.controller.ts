import {
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
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { ResumeParsingStatus, UserRole } from '@/utils/enums';
import { AiClientService } from './ai-client.service';
import { AiIntegrationService } from './ai-integration.service';
import { AiOperationCoordinator } from './ai-operation-coordinator.service';

@ApiTags('AI Candidate')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
@Throttle({ short: { limit: 1, ttl: 1000 }, long: { limit: 5, ttl: 60000 } })
@Controller('ai/candidate')
export class AiCandidateGatewayController {
  constructor(
    private readonly ai: AiClientService,
    private readonly integration: AiIntegrationService,
    private readonly operations: AiOperationCoordinator,
  ) {}

  @Post('resumes/:resumeId/extract')
  @ApiOperation({
    summary: 'Extract a reviewable candidate-profile proposal from an owned CV',
    description:
      'The profile is never overwritten automatically. Missing facts remain null and human review is mandatory.',
  })
  @ApiHeader({ name: 'idempotency-key', required: true })
  async extract(
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @CurrentUser() user: { id: string },
    @Headers('x-request-id') requestId?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.operations.run(
      'resume-extraction',
      user.id,
      resumeId,
      idempotencyKey,
      async () => {
        const file = await this.integration.resumeContentForCandidate(
          resumeId,
          user.id,
        );
        await this.integration.updateResumeParsingStatus(
          resumeId,
          ResumeParsingStatus.PROCESSING,
        );
        try {
          const proposal = await this.ai.postFile<unknown>(
            '/api/v1/internal/ai/resumes/extract',
            file,
            requestId || randomUUID(),
          );
          await this.integration.updateResumeParsingStatus(
            resumeId,
            ResumeParsingStatus.COMPLETED,
          );
          return {
            proposal,
            resumeId,
            requiresHumanReview: true,
            appliedToProfile: false,
          };
        } catch (error) {
          await this.integration.updateResumeParsingStatus(
            resumeId,
            ResumeParsingStatus.FAILED,
            'AI extraction failed',
          );
          throw error;
        }
      },
    );
  }
}
