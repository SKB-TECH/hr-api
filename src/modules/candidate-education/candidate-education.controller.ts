import {
  Controller,Post,Get,Patch,Delete,Body,Param,Req,UseGuards,} from '@nestjs/common';

import {ApiTags,ApiBearerAuth,ApiOperation,ApiResponse,ApiParam,ApiBody,
} from '@nestjs/swagger';

import { CandidateEducationService } from './candidate-education.service';
import { CreateEducationDto } from './dto/create-candidate-education.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';

@ApiTags('Candidate-Education')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidate-education')
export class CandidateEducationController {
  constructor(private readonly service: CandidateEducationService) {}

  // CREATE
  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Add candidate education' })
  @ApiResponse({ status: 201, description: 'Education created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateEducationDto })
  create(@Req() req, @Body() dto: CreateEducationDto) {
    return this.service.add(req.user.id, dto);
  }
// GET education records for a specific candidate (for company/recruiter/admin)
@Get('candidates/:candidateId/education')  @ApiOperation({ summary: 'Get all candidate education records by candidate ID' })
@ApiResponse({ status: 200, description: 'List of education records' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Roles(UserRole.COMPANY_OWNER, UserRole.RECRUITER, UserRole.ADMIN)
findCandidateEducation(@Param('candidateId') candidateId: string) {
  return this.service.getByCandidateId(candidateId);
}

  // GET ALL education records for the authenticated user
  @Get()

  @ApiOperation({ summary: 'Get all candidate education records (the authenticated user)' })
  @ApiResponse({ status: 200, description: 'List of education records' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Roles(UserRole.CANDIDATE)
  findAll(@Req() req) {
    return this.service.getAll(req.user.id);
  }

  // UPDATE education record by ID
  @Patch(':id')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Update education record' })
  @ApiParam({ name: 'id', description: 'Education ID' })
  @ApiResponse({ status: 200, description: 'Education updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({ type: CreateEducationDto })
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: Partial<CreateEducationDto>,
  ) {
    return this.service.patch(req.user.id, id, dto);
  }

  // DELETE education record by ID
  @Delete(':id')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Delete education record' })
  @ApiParam({ name: 'id', description: 'Education ID' })
  @ApiResponse({ status: 200, description: 'Education deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Req() req, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}