import {Controller,Post,Get,Delete,Patch,Param,UploadedFile,UseInterceptors,Body, ParseUUIDPipe,} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidateResumeService } from './candidate-resume.service';
import { RolesGuard } from '../candidate-profile/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody} from '@nestjs/swagger';
import {UseGuards,Req} from '@nestjs/common';
import { ResumeFileInterceptor } from './interceptors/resume-upload.interceptor';
import { Roles } from '../candidate-profile/decorators/roles.decorator';
import { UserRole } from '@prisma/client';



@ApiTags('Resumes')
@Controller('resumes')
@ApiBearerAuth()
@Roles(UserRole.CANDIDATE)
@UseGuards(JwtAuthGuard, RolesGuard)

export class CandidateResumeController {
  constructor(private readonly resumeService: CandidateResumeService) {}
  
  @Post()
  @ApiOperation({ summary: 'add candidate resumes' })
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
  @ApiResponse({ status: 201, description: 'Resume uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get all resumes for a candidate' })
  @ApiResponse({ status: 200, description: 'Resumes retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAll(@Req() req) {
    return this.resumeService.getAll(req.user.id);
  }


  
  @Get('default')
  @ApiOperation({ summary: 'Get default resume for a candidate' })
  @ApiResponse({ status: 200, description: 'Default resume retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getDefault(@Req() req) {
    return this.resumeService.getDefault(req.user.id);
  }

  


  //endpoint to set a resume as default for a candidate
  @Patch('default/:resumeId')
  @ApiOperation({ summary: 'Set a resume as default' })
  @ApiResponse({ status: 200, description: 'Resume set as default successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  setDefault(@Param('resumeId', ParseUUIDPipe) resumeId: string, @Req() req) {
    return this.resumeService.setDefault(resumeId, req.user.id);
  }
    


  //endpoint to delete a resume
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a resume' })
  @ApiResponse({ status: 204, description: 'Resume deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  delete(@Param('id') id: string, @Req() req) {
    return this.resumeService.deleteResume(id, req.user.id);
  }
}