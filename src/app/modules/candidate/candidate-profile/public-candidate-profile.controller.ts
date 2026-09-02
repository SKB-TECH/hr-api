import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { sendResult } from '@/helpers/message/sendResult';
import { CandidateProfilesService } from './candidate-profile.service';

@ApiTags('Public / Candidate Profiles')
@Controller('public/candidates')
export class PublicCandidateProfilesController {
  constructor(private readonly profilesService: CandidateProfilesService) {}

  @Get(':candidateId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve a shareable public candidate profile without login',
    description:
      'Returns professional information only. Contact details, salary, birth date, address and resumes are never exposed.',
  })
  @ApiParam({ name: 'candidateId', description: 'Candidate profile UUID' })
  @ApiResponse({ status: 200, description: 'Public profile returned' })
  @ApiResponse({
    status: 404,
    description: 'Profile missing, disabled, or not publicly visible',
  })
  async findOne(@Param('candidateId', ParseUUIDPipe) candidateId: string) {
    const profile = await this.profilesService.getPublicProfile(candidateId);
    return sendResult(
      HttpStatus.OK,
      'Public candidate profile fetched',
      profile,
    );
  }
}
