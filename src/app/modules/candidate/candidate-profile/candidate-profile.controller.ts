import {
  Controller,
  Get,
  UseGuards,
  Req,
  Patch,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CandidateProfilesService } from './candidate-profile.service';
import { UserCandidateDto } from './dto/user-candidate.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateUserCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { UpdateCandidateProfileFormDto } from './dto/update-candidate-profile-form.dto';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UserRole } from '../../../../utils/enums';
import { UnauthorizedErrorDto } from '@/helpers/message/unauthorized.response';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Candidate / Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidate/profile')
export class CandidateProfilesController {
  constructor(private readonly profilesService: CandidateProfilesService) {}

  @Get('info')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Retrieve full candidate profile',
    description: `
    notes:
        - retrieve the full profile information for the authenticated candidate user.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Profile returned successfully.',
    type: UserCandidateDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async getProfile(@Req() req: any) {
    const userId = req.user.id;
    const userProfile = await this.profilesService.getCandidateProfile(userId);
    const dto = new UserCandidateDto(userProfile);
    return sendResult(HttpStatus.OK, 'Profile fetched', dto);
  }

  @Patch('update')
  @Roles(UserRole.CANDIDATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatarFile'))
  @ApiBody({ type: UpdateCandidateProfileFormDto })
  @ApiOperation({
    summary: 'Partially update user identity and candidate professional fields',
    description: `
    notes:
        - partially update the profile for the authenticated candidate user.
        - send fields as flat multipart/form-data fields; attach the avatar image
          in the "avatarFile" field (optional). Omitted fields are left unchanged.
        - This endpoint is accessible only to users with the CANDIDATE role.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'profile updated successfully',
    type: UserCandidateDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Candidate profile record could not be found.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async updateCandidateProfile(
    @Req() req: any,
    @Body() dto: UpdateUserCandidateProfileDto,
    @UploadedFile() file?: any,
  ) {
    const userId = req.user.id;
    const updatedProfile = await this.profilesService.updateCandidateProfile(
      userId,
      dto,
      file,
    );
    const responseDto = new UserCandidateDto(updatedProfile);
    return sendResult(HttpStatus.OK, 'Profile updated', responseDto);
  }
}
