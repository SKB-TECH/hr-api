import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import { CandidateResumeService } from './candidate-resume.service';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { JwtAuthGuard } from '@/app/modules/auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { UseGuards, Req } from '@nestjs/common';
import { ResumeFileInterceptor } from './interceptors/resume-upload.interceptor';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UserRole } from '../../../../utils/enums';
import { UnauthorizedErrorDto } from '@/helpers/message/unauthorized.response';
import { ResumeResponseDto } from './dto/resume.response.dto';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Candidate / Resumes')
@Controller('resumes')
@ApiBearerAuth()
export class CandidateResumeController {
  constructor(private readonly resumeService: CandidateResumeService) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'add candidate resumes',
    description: `
    notes:
        - upload a new resume for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Resume uploaded successfully.',
    type: ResumeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  @UseInterceptors(ResumeFileInterceptor)
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Body('title') title: string,
  ) {
    const data = await this.resumeService.uploadResume(
      file,
      req.user.id,
      title,
    );
    return sendResult(HttpStatus.CREATED, 'Resume uploaded', data);
  }

  @Get()
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get all resumes for a candidate',
    description: `
    notes:
        - retrieve all resumes for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Resumes retrieved successfully.',
    type: ResumeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async getAll(@Req() req) {
    const data = await this.resumeService.getAll(req.user.id);
    return sendResult(HttpStatus.OK, 'Resumes fetched', data);
  }

  @Get('default/:candidateId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Get default resume by candidate ID to all authenticated users',
    description: `
  notes:
      - retrieve the default resume for a specific candidate by their ID.
      - This endpoint is accessible to all authenticated users.
  `,
  })
  @ApiParam({
    name: 'candidateId',
    type: 'string',
    format: 'uuid',
    description:
      'The unique identifier of the candidate whose default resume is being retrieved',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b',
  })
  @ApiResponse({
    status: 200,
    description: 'Default resume retrieved successfully.',
    type: ResumeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async getPublicDefault(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    const data = await this.resumeService.getPublicDefault(candidateId);
    return sendResult(HttpStatus.OK, 'Default resume fetched', data);
  }

  @Get('default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Get default resume for a candidate for all authenticated users',
    description: `
    notes:
        - retrieve the default resume for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Default resume retrieved successfully.',
    type: ResumeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async getDefault(@Req() req) {
    const data = await this.resumeService.getDefault(req.user.id);
    return sendResult(HttpStatus.OK, 'Default resume fetched', data);
  }

  @Patch('default/:resumeId')
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Set a resume as default',
    description: `
    notes:
        - set a specific resume as the default for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Resume set as default successfully.',
    type: ResumeResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  @ApiParam({
    name: 'resumeId',
    type: 'string',
    format: 'uuid',
    description: 'The unique identifier of the resume to be set as default',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b',
  })
  async setDefault(
    @Param('resumeId', ParseUUIDPipe) resumeId: string,
    @Req() req,
  ) {
    const data = await this.resumeService.setDefault(resumeId, req.user.id);
    return sendResult(HttpStatus.OK, 'Default resume set', data);
  }

  @Delete(':id')
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary: 'Delete a resume',
    description: `
    notes:
        - delete a specific resume for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'The unique identifier of the resume to be deleted',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b',
  })
  @ApiResponse({ status: 204, description: 'Resume deleted successfully.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    const data = await this.resumeService.deleteResume(id, req.user.id);
    return sendResult(HttpStatus.OK, 'Resume deleted', data);
  }
}
