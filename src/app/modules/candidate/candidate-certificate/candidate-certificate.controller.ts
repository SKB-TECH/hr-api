import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UserRole } from '../../../../utils/enums';

import { JwtAuthGuard } from '@/app/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UnauthorizedErrorDto } from '@/helpers/message/unauthorized.response';

import { CandidateCertificationService } from './candidate-certificate.service';
import { CreateCandidateCertificationDto } from './dto/create-candidate-certificate.dto';
import { CandidateCertificationResponseDto } from './dto/certification-response.dto';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Candidate / Certifications')
@Controller('candidate/certifications')
export class CandidateCertificationController {
  constructor(private readonly service: CandidateCertificationService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add candidate certification',
    description:
      'Creates a new certification record associated with the authenticated candidate profile.',
  })
  @ApiBody({ type: CreateCandidateCertificationDto })
  @ApiResponse({
    status: 201,
    description: 'Certification created successfully',
    type: CandidateCertificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation or chronological date errors',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async create(@Req() req, @Body() dto: CreateCandidateCertificationDto) {
    const data = await this.service.add(req.user.id, dto);
    return sendResult(HttpStatus.CREATED, 'Certificate added', data);
  }

  @Get(':candidateId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get certificates by Candidate candidateprofile ID',
    description:
      'Allows internal administrators, owners, and hiring recruiters to view an applicant’s active certificates.',
  })
  @ApiParam({
    name: 'candidateId',
    type: 'string',
    format: 'uuid',
    description: 'The unique identifier of the candidate profile',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b',
  })
  @ApiResponse({
    status: 200,
    description: 'List of candidate credentials',
    type: [CandidateCertificationResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Structural UUID format errors',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Candidate profile context missing',
  })
  async findCandidateCertifications(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    const data = await this.service.getByCandidateId(candidateId);
    return sendResult(HttpStatus.OK, 'Certificates fetched', data);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all certifications for the authenticated candidate',
    description:
      'Fetches all certificates added by the logged-in user profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of your certifications',
    type: [CandidateCertificationResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async findAllSelf(@Req() req) {
    const data = await this.service.getAllSelf(req.user.id);
    return sendResult(HttpStatus.OK, 'Certificates fetched', data);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update certification details',
    description:
      'Allows partial updates to a candidate’s own qualification item by record UUID.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The record identifier of the certification entry',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b',
  })
  @ApiBody({ type: CreateCandidateCertificationDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Certification item modified successfully',
    type: CandidateCertificationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation or date mismatch checks',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Altering records owned by someone else',
  })
  async update(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateCandidateCertificationDto>,
  ) {
    const data = await this.service.patch(req.user.id, id, dto);
    return sendResult(HttpStatus.OK, 'Certificate updated', data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete certification record',
    description:
      'Permanently destroys an isolated credential row tracking entry.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The certification record row ID token',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b',
  })
  @ApiResponse({
    status: 200,
    description: 'Deleted clean record message mapping wrapper returned',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Modifying unauthorized profile data',
  })
  @ApiResponse({ status: 404, description: 'Record not found mapping context' })
  async remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.remove(req.user.id, id);
    return sendResult(HttpStatus.OK, 'Certificate deleted', data);
  }
}
