import {Controller,Post,Get,Delete,Patch,Param,UploadedFile,UseInterceptors,Body, ParseUUIDPipe,} from '@nestjs/common';
import { CandidateResumeService } from './candidate-resume.service';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody,ApiParam} from '@nestjs/swagger';
import {UseGuards,Req} from '@nestjs/common';
import { ResumeFileInterceptor } from './interceptors/resume-upload.interceptor';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UnauthorizedErrorDto } from '@/common/response/unauthorized.response';
import { ResumeResponseDto} from './dto/resume.response.dto';



@ApiTags('Candidate-Resumes')
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
    `
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
  @ApiResponse({ status: 201, description: 'Resume uploaded successfully.', type: ResumeResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request'  })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @UseInterceptors(ResumeFileInterceptor)
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
    @Body('title') title: string,
  ) {
    
    
    return this.resumeService.uploadResume(file, req.user.id, title);
  }


  //endpoint to get all resumes for a candidate
  @Get()
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Get all resumes for a candidate',
    description: `
    notes:
        - retrieve all resumes for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `
   })
  @ApiResponse({ status: 200, description: 'Resumes retrieved successfully.', type: ResumeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  getAll(@Req() req) {
    return this.resumeService.getAll(req.user.id);
  }

@Get('default/:candidateId')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiOperation({ 
  summary: 'Get default resume by candidate ID to all authenticated users',
  description: `
  notes:
      - retrieve the default resume for a specific candidate by their ID.
      - This endpoint is accessible to all authenticated users.
  `
 })
@ApiParam({ 
  name: 'candidateId',
  type: 'string', 
  format: 'uuid', 
  description: 'The unique identifier of the candidate whose default resume is being retrieved',
  example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b' })
@ApiResponse({ status: 200, description: 'Default resume retrieved successfully.', type: ResumeResponseDto })
@ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
getPublicDefault(@Param('candidateId', ParseUUIDPipe) candidateId: string) {
  return this.resumeService.getPublicDefault(candidateId);
}


  //end point to get the default resume for a candidate, accessible
  @Get('default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ 
    summary: 'Get default resume for a candidate for all authenticated users',
    description: `
    notes:
        - retrieve the default resume for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `
   })
  @ApiResponse({ status: 200, description: 'Default resume retrieved successfully.', type: ResumeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  getDefault(@Req() req) {
    return this.resumeService.getDefault(req.user.id);
  }

  


  //endpoint to set a resume as default for a candidate
  @Patch('default/:resumeId')
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Set a resume as default',
    description: `
    notes:
        - set a specific resume as the default for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `
   })
  @ApiResponse({ status: 200, description: 'Resume set as default successfully.', type: ResumeResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiParam({ 
    name: 'resumeId',
    type: 'string',
    format: 'uuid',
    description: 'The unique identifier of the resume to be set as default',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b' })
  setDefault(@Param('resumeId', ParseUUIDPipe) resumeId: string, @Req() req) {
    return this.resumeService.setDefault(resumeId, req.user.id);
  }
    


  //endpoint to delete a resume
  @Delete(':id')
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Delete a resume',
    description: `
    notes:
        - delete a specific resume for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `
   })
  @ApiParam({ 
    name: 'id',
    type: 'string', 
    format: 'uuid', 
    description: 'The unique identifier of the resume to be deleted',
    example: '3a889af9-fd9f-4c56-86c8-47a05f3af95b' })
  @ApiResponse({ status: 204, description: 'Resume deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  delete(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.resumeService.deleteResume(id, req.user.id);
  }
}