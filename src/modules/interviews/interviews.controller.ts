import {
  Body,
  Controller,
  Get,
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

@ApiTags('Interviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule an interview (screen 3.8)' })
  @ApiResponse({ status: 201, description: 'Interview scheduled' })
  create(@Body() dto: CreateInterviewDto) {
    return this.interviewsService.create(dto);
  }

  @Get('application/:applicationId')
  @ApiOperation({ summary: 'Get interviews for an applicant (screen 3.8)' })
  findByApplication(
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
  ) {
    return this.interviewsService.findByApplication(applicationId);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get company interview schedule (screen 3.14)' })
  findByCompany(@Param('companyId') companyId: string) {
    return this.interviewsService.findByCompany(companyId);
  }

  @Patch(':id/feedback')
  @ApiOperation({ summary: 'Add feedback to an interview (screen 3.8)' })
  addFeedback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddFeedbackDto,
  ) {
    return this.interviewsService.addFeedback(id, dto);
  }
}
