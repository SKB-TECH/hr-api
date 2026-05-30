import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CandidateProfilesService } from './candidate-profile.service';
import { UserCandidateEntity } from './entities/candidate-profile.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('CandidateProfiles')
@ApiBearerAuth()
@Controller('candidate')
// @UseGuards(JwtAuthGuard) 
export class CandidateProfilesController {
  constructor(private readonly profilesService: CandidateProfilesService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retrieve full candidate profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile returned successfully.',

    type: UserCandidateEntity 
  })
  async getProfile(@Req() req: any): Promise<UserCandidateEntity> {
    const userId = req.user.id;
    const userRole = req.user.role;

    const userProfile = await this.profilesService.getCandidateProfile(userId, userRole);
    
    // Wrap database payload inside the secure entity mapper class
    return new UserCandidateEntity(userProfile);
  }
}