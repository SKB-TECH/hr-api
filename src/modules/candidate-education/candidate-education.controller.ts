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
import { UnauthorizedErrorDto } from '@/common/response/unauthorized.response';
import { CandidateEducationResponseDto } from './dto/candidate-education-response.dto';

@ApiTags('Candidate-Education')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidate-education')
export class CandidateEducationController {
  constructor(private readonly service: CandidateEducationService) {}

  // CREATE
  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ 
    summary: 'Add candidate education',
    description: `
    notes:
        - add education record for the authenticated candidate user. Only users with the CANDIDATE role can perform this action.
        - Provide the education details in the request body. If the record is successfully created, the created education record will be returned. 
        - If the user is not authenticated or does not have the CANDIDATE role, an appropriate error message will be returned.
    `
   })
  @ApiResponse({ status: 201, description: 'Education created successfully', type: CandidateEducationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiBody({ type: CreateEducationDto })
  create(@Req() req, @Body() dto: CreateEducationDto) {
    return this.service.add(req.user.id, dto);
  }
// GET education records for a specific candidate (for company/recruiter/admin)
@Get('candidates/:candidateId/education')  @ApiOperation({ 
  summary: 'Get all candidate education records by candidate ID',
  description: `
    notes:
        - get all education records for a specific candidate.
        - This endpoint is accessible to users with the COMPANY_OWNER, RECRUITER, or ADMIN roles.
  `
 })
@ApiResponse({ status: 200, description: 'List of education records', type: [CandidateEducationResponseDto] })
@ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@Roles(UserRole.COMPANY_OWNER, UserRole.RECRUITER, UserRole.ADMIN)
findCandidateEducation(@Param('candidateId') candidateId: string) {
  return this.service.getByCandidateId(candidateId);
}

  // GET ALL education records for the authenticated user
  @Get()

  @ApiOperation({ 
    summary: 'Get all candidate education records (the authenticated user)',
    description: `
    notes:
        - get all education records for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `
   })
  @ApiResponse({ status: 200, description: 'List of education records', type: [CandidateEducationResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @Roles(UserRole.CANDIDATE)
  findAll(@Req() req) {
    return this.service.getAll(req.user.id);
  }

  // UPDATE education record by ID
  @Patch(':id')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ 
    summary: 'Update education record',
    description: `
    notes:
        - update an education record by its ID. Only the owner of the record (the candidate) can perform this action.
        - Provide the education ID as a path parameter and the fields to update in the request body. If the record is successfully updated, the updated education record will be returned. 
        - If the record does not exist or the user is not authorized to update it, an appropriate error message will be returned.
    `
   })
  @ApiParam({ name: 'id', description: 'Education ID' })
  @ApiResponse({ status: 200, description: 'Education updated successfully', type: CandidateEducationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
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
  @ApiOperation({ 
    summary: 'Delete education record',
    description:`
    notes:
        - delete an education record by its ID. Only the owner of the record (the candidate) can perform this action.
        - Provide the education ID as a path parameter. If the record is successfully deleted, a success message will be returned. 
        - If the record does not exist or the user is not authorized to delete it, an appropriate error message will be returned.
     
    `
   })
  @ApiParam({ name: 'id', description: 'Education ID' })
  @ApiResponse({ status: 200, description: 'Education deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  remove(@Req() req, @Param('id') id: string) {
    return this.service.remove(req.user.id, id);
  }
}