import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/app/modules/auth/guards/jwt-auth.guard';

import { CandidateExperienceService } from './candidate-experience.service';
import { CreateCandidateExperienceDto } from './dto/create-candidate-experience.dto';
import { CandidateExperienceResponseDto } from './dto/experience-response.dto';
import { UnauthorizedErrorDto } from '@/helpers/message/unauthorized.response';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { UserRole } from '@/utils/enums';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Candidate / Experience')
@Controller('candidate/experience')
export class CandidateExperienceController {
  constructor(private readonly service: CandidateExperienceService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create candidate experience ',
    description: 'Allows a candidate to add work experience to their profile.',
  })
  @ApiBody({ type: CreateCandidateExperienceDto })
  @ApiResponse({ status: 201, type: CandidateExperienceResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedErrorDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Validation errors or business rule violations (e.g., end date before start date)',
  })
  async create(@Req() req, @Body() dto: CreateCandidateExperienceDto) {
    const data = await this.service.create(req.user.id, dto);
    return sendResult(HttpStatus.CREATED, 'Experience added', data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get candidate experiences',
    description:
      'Returns all experiences belonging to the authenticated candidate.',
  })
  @ApiResponse({ status: 200, type: [CandidateExperienceResponseDto] })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedErrorDto,
  })
  async findAll(@Req() req) {
    const data = await this.service.findAll(req.user.id);
    return sendResult(HttpStatus.OK, 'Experiences fetched', data);
  }

  @Get('public/:candidateId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Public candidate experience view',
    description:
      'Returns public experience information for recruiters and visitors.',
  })
  @ApiResponse({
    status: 200,
    description: 'Public experience data',
    type: [CandidateExperienceResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedErrorDto,
  })
  async findPublicExperiences(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    const data = await this.service.findPublicExperiences(candidateId);
    return sendResult(HttpStatus.OK, 'Experiences fetched', data);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get single experience',
    description:
      'Returns a specific experience belonging to the authenticated candidate.',
  })
  @ApiResponse({ status: 200, type: CandidateExperienceResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedErrorDto,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The unique identifier of the candidate experience record',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const data = await this.service.findOne(id, req.user.id);
    return sendResult(HttpStatus.OK, 'Experience fetched', data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update experience for authenticated candidate',
    description: 'Updates an existing experience record.',
  })
  @ApiBody({ type: CreateCandidateExperienceDto })
  @ApiResponse({ status: 200, type: CandidateExperienceResponseDto })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Validation errors or business rule violations (e.g., end date before start date)',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The unique identifier of the candidate experience record',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
    @Body() dto: Partial<CreateCandidateExperienceDto>,
  ) {
    const data = await this.service.update(id, req.user.id, dto);
    return sendResult(HttpStatus.OK, 'Experience updated', data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete experience for authenticated candidate',
    description: 'Deletes a candidate experience record.',
  })
  @ApiResponse({ status: 204, description: 'Experience deleted successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedErrorDto,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The unique identifier of the candidate experience record',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const data = await this.service.remove(id, req.user.id);
    return sendResult(HttpStatus.OK, 'Experience deleted', data);
  }
}
