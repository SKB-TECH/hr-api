import {
  Body,
  Controller,
  Delete,
  Get,
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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CandidateExperienceService } from './candidate-experience.service';
import { CreateCandidateExperienceDto } from './dto/create-candidate-experience.dto';
import { CandidateExperienceResponseDto } from './dto/experience-response.dto';
import { UnauthorizedErrorDto } from '@/common/response/unauthorized.response';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('Candidate Experience')
@Controller('candidate-experience')
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
    description: 'Bad Request - Validation errors or business rule violations (e.g., end date before start date)',
  })
  create(@Req() req, @Body() dto: CreateCandidateExperienceDto) {
    return this.service.create(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get candidate experiences',
    description: 'Returns all experiences belonging to the authenticated candidate.',
  })
  @ApiResponse({ status: 200, type: [CandidateExperienceResponseDto] })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedErrorDto,
  })
  
  findAll(@Req() req) {
    return this.service.findAll(req.user.id);
  }

  @Get('public/:candidateId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Public candidate experience view',
    description: 'Returns public experience information for recruiters and visitors.',
  })
  @ApiResponse({ status: 200, description: 'Public experience data', type: [CandidateExperienceResponseDto] })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: UnauthorizedErrorDto,
  })
  findPublicExperiences(@Param('candidateId', ParseUUIDPipe) candidateId: string) {
    return this.service.findPublicExperiences(candidateId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get single experience',
    description: 'Returns a specific experience belonging to the authenticated candidate.',
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
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.service.findOne(id, req.user.id);
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
    description: 'Bad Request - Validation errors or business rule violations (e.g., end date before start date)',
  })
  @ApiParam({ 
    name: 'id',
    type: 'string', 
    format: 'uuid', 
    description: 'The unique identifier of the candidate experience record',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
    @Body() dto: Partial<CreateCandidateExperienceDto>,
  ) {
    return this.service.update(id, req.user.id, dto);
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
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.service.remove(id, req.user.id);
  }
}