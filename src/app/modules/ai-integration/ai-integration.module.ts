import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../jobs/entities/job.entity';
import { Application } from '../applications/entities/application.entity';
import { AiIntegrationController } from './ai-integration.controller';
import { AiIntegrationService } from './ai-integration.service';
import { AiServiceGuard } from './ai-service.guard';
import { CandidateProfile } from '../candidate/candidate-profile/entities/candidate-profile.entity';
import { Resume } from '../candidate/candidate-resume/entities/resume.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';
import { AiGatewayController } from './ai-gateway.controller';
import { AiClientService } from './ai-client.service';
import { AiOperationCoordinator } from './ai-operation-coordinator.service';
import { AiCandidateGatewayController } from './ai-candidate-gateway.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      Application,
      CandidateProfile,
      Resume,
      CompanyMember,
    ]),
  ],
  controllers: [
    AiIntegrationController,
    AiGatewayController,
    AiCandidateGatewayController,
  ],
  providers: [
    AiIntegrationService,
    AiServiceGuard,
    AiClientService,
    AiOperationCoordinator,
  ],
})
export class AiIntegrationModule {}
