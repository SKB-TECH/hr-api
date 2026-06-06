import { Controller, Post, Delete, Get, Body, Req, Param, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { CandidateSkillService } from './candidate-skill.service';
import { AddCandidateSkillDto } from './dto/create-candidate-skill.dto';
import { CandidateSkillResponseDto } from './dto/candidate-skill-response.dto';
import { UnauthorizedErrorDto } from '@/common/response/unauthorized.response';
import {UseGuards,} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';



@ApiTags('Candidate Skills Ecosystem')
@Controller('candidate-skills')
@ApiBearerAuth()
export class CandidateSkillController {
  constructor(private readonly candidateSkillService: CandidateSkillService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)

  @ApiOperation({ 
    summary: 'Map a technology skill to profile',
    description: 'adding skill to authenticated user and map him to his profile' 
  })
  @ApiBody({
    type: AddCandidateSkillDto,
    schema: {
      example: {
        skillId: '8f3b29c1-472d-4bfb-b462-871d87f7b244',
        level: 'expert',
        yearsExperience: 4,
      },
    },
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Skill reference mapped successfully to portfolio.',
    type: CandidateSkillResponseDto
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication requirements missing, malformed, or expired.',
    type: UnauthorizedErrorDto
  })
  async create(@Req() req: any, @Body() dto: AddCandidateSkillDto) {
    const userId = req.user.id;
    return this.candidateSkillService.addSkill(userId, dto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'Retrieve my personal portfolio skills',
    description: 'Private endpoint. Resolves candidate identity from the active JWT token payload to return skills for the personal dashboard view.' 
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Candidate skill collection retrieved successfully.',
    type: [CandidateSkillResponseDto]
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication requirements missing, malformed, or expired.',
    type: UnauthorizedErrorDto
  })
  async findMySkills(@Req() req: any) {
    const userId = req.user.id;
    return this.candidateSkillService.findMySkills(userId);
  }

  @Get('candidate/:candidateId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Fetch public skills of a candidate',
    description: 'Public endpoint. Allows unauthenticated client routing views to read a candidate\'s skill array via their public profile ID.' 
  })
  @ApiParam({ 
    name: 'candidateId', 
    type: String, 
    description: 'The strict database primary key (UUID v4) tracking the target CandidateProfile model.',
    example: 'd5f8c8a1-2b81-432d-9481-229c91f1a111'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Public candidate skill collection list retrieved.',
    type: [CandidateSkillResponseDto]
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'No CandidateProfile matches the provided identifier.' 
  })
  async findPublicSkills(@Param('candidateId', new ParseUUIDPipe({ version: '4' })) candidateId: string) {
    return this.candidateSkillService.findAllByCandidate(candidateId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.CANDIDATE)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ 
    summary: 'remove  skill to profile'
  })
  @ApiParam({ 
    name: 'id', 
    type: String, 
    description: 'ID must be uuid',
    example: 'c13b29c1-922d-4bfb-b462-871d87f7b999'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'skill deleted' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: UnauthorizedErrorDto })
  async remove(@Req() req: any, @Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const userId = req.user.id;
    return this.candidateSkillService.removeSkill(userId, id);
  }
}