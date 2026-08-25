import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCompanyNotificationPreferencesDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() recruiterRelated?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  subscriptionNotifications?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() billingAlerts?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() securityUpdates?: boolean;
}
