import { Controller, Get, UseGuards, Req, Patch, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes,ApiExtraModels } from '@nestjs/swagger';
import { CandidateProfilesService } from './candidate-profile.service';
import { UserCandidateDto } from './entities/candidate-profile.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CandidateProfileUploadDto } from './dto/candidate-profile-upload.dto'; 
import { ParseProfileJsonPipe } from '../../common/pipes/parse-json.pipe'; 
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UnauthorizedErrorDto} from '@/common/response/unauthorized.response';




@ApiTags('Candidate-Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidate')
export class CandidateProfilesController {
  constructor(private readonly profilesService: CandidateProfilesService) {}

  @Get('profile_info')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ 
    summary: 'Retrieve full candidate profile',
    description: `
    notes:
        - retrieve the full profile information for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `
   })
  @ApiResponse({ status: 200, description: 'Profile returned successfully.', type: UserCandidateDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  async getProfile(@Req() req: any): Promise<UserCandidateDto> {
    const userId = req.user.id;
    const userProfile = await this.profilesService.getCandidateProfile(userId);
    return new UserCandidateDto(userProfile);
  }

  @Patch('update_profile') 
  @Roles(UserRole.CANDIDATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatarFile'))
  @ApiExtraModels(UpdateUserCandidateProfileDto)
  @ApiOperation({ 
    summary: 'Partially update user identity and candidate professional fields',
    description: `
    notes:
        - partially update the profile information for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `
   })
  @ApiResponse({ status: 200, description: 'profile updated successfully', type: UserCandidateDto })  
  @ApiResponse({ status: 404, description: 'Candidate profile record could not be found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  async updateCandidateProfile(
    @Req() req: any, 
    // @Body() formPayload: CandidateProfileUploadDto, 
    @Body('data', ParseProfileJsonPipe) validatedDto: UpdateUserCandidateProfileDto, 
    @UploadedFile() file?: any,
  ): Promise<UserCandidateDto> {
    const userId = req.user.id;

    
    const updatedProfile = await this.profilesService.updateCandidateProfile(userId, validatedDto, file);
    return new UserCandidateDto(updatedProfile);
  }
}