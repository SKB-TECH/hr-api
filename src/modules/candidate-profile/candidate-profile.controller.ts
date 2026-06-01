import { Controller, Get, UseGuards, Req, Patch, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes,ApiExtraModels } from '@nestjs/swagger';
import { CandidateProfilesService } from './candidate-profile.service';
import { UserCandidateEntity } from './entities/candidate-profile.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { CandidateProfileUploadDto } from './dto/candidate-profile-upload.dto'; // ✅ Imported
import { ParseProfileJsonPipe } from '../../common/pipes/parse-json.pipe'; // ✅ Imported custom parsing pipe
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Express } from 'express';




@ApiTags('CandidateProfiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidate')
export class CandidateProfilesController {
  constructor(private readonly profilesService: CandidateProfilesService) {}

  @Get('profile_info')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Retrieve full candidate profile' })
  @ApiResponse({ status: 200, description: 'Profile returned successfully.', type: UserCandidateEntity })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: any): Promise<UserCandidateEntity> {
    const userId = req.user.id;
    const userProfile = await this.profilesService.getCandidateProfile(userId);
    return new UserCandidateEntity(userProfile);
  }

  @Patch('update_profile') 
  @Roles(UserRole.CANDIDATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatarFile'))
  @ApiExtraModels(UpdateUserCandidateProfileDto)
  @ApiOperation({ summary: 'Partially update user identity and candidate professional fields' })
  @ApiResponse({ status: 200, description: 'profile updated successfully', type: UserCandidateEntity })  
  @ApiResponse({ status: 404, description: 'Candidate profile record could not be found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCandidateProfile(
    @Req() req: any, 
    @Body() formPayload: CandidateProfileUploadDto, 
    @Body('data', ParseProfileJsonPipe) validatedDto: UpdateUserCandidateProfileDto, 
    @UploadedFile() file?: any,
  ): Promise<UserCandidateEntity> {
    const userId = req.user.id;

    // Send the cleanly parsed JSON data straight to your service
    const updatedProfile = await this.profilesService.updateCandidateProfile(userId, validatedDto, file);
    return new UserCandidateEntity(updatedProfile);
  }
}