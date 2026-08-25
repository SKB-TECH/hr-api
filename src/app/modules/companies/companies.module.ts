import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CompanyMember } from './entities/company-member.entity';
import { CompanyTeamMember } from './entities/company-team-member.entity';
import { User } from '../users/entities/user.entity';
import { CompanyInvitation } from './entities/company-invitation.entity';
import { CompanyNotificationPreference } from './entities/company-notification-preference.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanyMember,
      CompanyTeamMember,
      CompanyInvitation,
      CompanyNotificationPreference,
      User,
    ]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}
