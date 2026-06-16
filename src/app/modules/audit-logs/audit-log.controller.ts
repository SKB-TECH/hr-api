import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../../../utils/enums';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../helpers/guards/roles.guard';
import { Roles } from '../../../helpers/decorators/roles.decorator';
import { sendPaginated } from '@/helpers/message/sendResult';

@ApiTags('Admin - Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated audit logs (Admin only)' })
  @ApiResponse({ status: 200, description: 'Audit logs returned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  async findAll(@Query() query: QueryAuditLogDto) {
    const result = await this.auditLogService.findAll(query);
    return sendPaginated(HttpStatus.OK, 'Audit logs fetched', result);
  }
}
