import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ParseUUIDPipe } from '@nestjs/common';
import { SkillManagementService } from './candidate-skill.service';
import { CreateCategoryDto, CreateSkillDto, AssignSkillDto } from './dto/skill-management.dto';
import { CategoryResponseDto, SkillResponseDto, CandidateSkillResponseDto } from './dto/skill-management-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { Roles } from '@/common/decorators/roles.decorator';
import { UnauthorizedErrorDto } from '@/common/response/unauthorized.response';

@ApiTags('Candidate / Skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidate/skills')
export class SkillManagementController {
  constructor(private readonly service: SkillManagementService) {}


  // endpoint for admin and any company owner to creta ejob category
  @Post('admin/categories')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new skill category (Admin Only)' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  @ApiBody({ type: CreateCategoryDto })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.service.createCategory(dto);
  }

  @Delete('admin/categories/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a skill category (Admin Only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 204 })
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteCategory(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Fetch all available skill categories  ' })
  @ApiResponse({ status: 200, type: [CategoryResponseDto] })
  getAllCategories() {
    return this.service.findAllCategories();
  }

  @Post('admin/directory')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Register a new global skill (Admin Only)' })
  @ApiResponse({ status: 201, type: SkillResponseDto })
  @ApiBody({ type: CreateSkillDto })
  createSkill(@Body() dto: CreateSkillDto) {
    return this.service.createSkill(dto);
  }

  @Get('directory')
  @ApiOperation({ summary: 'Query all skills available' })
  @ApiResponse({ status: 200, type: [SkillResponseDto] })
  getGlobalDirectoryList() {
    return this.service.findAllSkills();
  }

  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Attach or update personal profile skills' })
  @ApiResponse({ status: 201, type: CandidateSkillResponseDto })
  @ApiBody({ type: AssignSkillDto })
  linkSkillSelf(@Req() req, @Body() dto: AssignSkillDto) {
    return this.service.assignSkillToCandidate(req.user.id, dto);
  }

  @Get()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Retrieve all assigned skills for active candidate context' })
  @ApiResponse({ status: 200, type: [CandidateSkillResponseDto] })
  getMyActiveSkills(@Req() req) {
    return this.service.getCandidateSkills(req.user.id);
  }

  @Delete(':skillId')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Detach a skill off candidate profile identity' })
  @ApiParam({ name: 'skillId', format: 'uuid' })
  @ApiResponse({ status: 204 })
  removeMySkillLink(@Req() req, @Param('skillId', ParseUUIDPipe) skillId: string) {
    return this.service.removeSkillFromCandidate(req.user.id, skillId);
  }

  @Get(':candidateId')
  // @Roles(UserRole.COMPANY_OWNER, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Audit professional profile skills mapping by candidate ID' })
  @ApiParam({ name: 'candidateId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [CandidateSkillResponseDto] })
  inspectProfileSkills(@Param('candidateId', ParseUUIDPipe) candidateId: string) {
    return this.service.getSkillsByCandidateProfileId(candidateId);
  }
}