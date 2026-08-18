import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { AddFeedbackDto } from './dto/add-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { sendResult } from '@/helpers/message/sendResult';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UserRole } from '@/utils/enums';

const companyRoles = [
  UserRole.COMPANY_OWNER,
  UserRole.HR_MANAGER,
  UserRole.RECRUITER,
  UserRole.ADMIN,
] as const;

@ApiTags('Interviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...companyRoles)
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule an interview (screen 3.8)' })
  @ApiResponse({ status: 201, description: 'Interview scheduled' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async create(
    @Body() dto: CreateInterviewDto,
    @CurrentUser() user?: { id: string },
  ) {
    const data = user
      ? await this.interviewsService.create(dto, user.id)
      : await this.interviewsService.create(dto);
    return sendResult(HttpStatus.CREATED, 'Interview scheduled', data);
  }

  @Get('application/:applicationId')
  @ApiOperation({ summary: 'Get interview list for an applicant (screen 3.8)' })
  async findByApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @CurrentUser() user?: { id: string },
  ) {
    const data = user
      ? await this.interviewsService.findByApplication(applicationId, user.id)
      : await this.interviewsService.findByApplication(applicationId);
    return sendResult(HttpStatus.OK, 'Interviews fetched', data);
  }

  @Get('company/:companyId')
  @ApiOperation({
    summary: 'Get all company interviews for schedule (screen 3.14)',
  })
  async findByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @CurrentUser() user?: { id: string },
  ) {
    const data = user
      ? await this.interviewsService.findByCompany(companyId, user.id)
      : await this.interviewsService.findByCompany(companyId);
    return sendResult(HttpStatus.OK, 'Interviews fetched', data);
  }

  @Patch(':id/feedback')
  @ApiOperation({ summary: 'Add feedback to an interview (screen 3.8)' })
  @ApiResponse({ status: 200, description: 'Feedback added' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  async addFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddFeedbackDto,
    @CurrentUser() user?: { id: string },
  ) {
    const data = user
      ? await this.interviewsService.addFeedback(id, dto, user.id)
      : await this.interviewsService.addFeedback(id, dto);
    return sendResult(HttpStatus.OK, 'Feedback added', data);
  }
}
