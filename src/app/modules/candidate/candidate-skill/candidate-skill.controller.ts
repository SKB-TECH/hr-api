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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ParseUUIDPipe } from '@nestjs/common';
import { SkillManagementService } from './candidate-skill.service';
import {
  CreateCategoryDto,
  CreateSkillDto,
  AssignSkillDto,
} from './dto/skill-management.dto';
import {
  CategoryResponseDto,
  SkillResponseDto,
  CandidateSkillResponseDto,
} from './dto/skill-management-response.dto';
import { JwtAuthGuard } from '@/app/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { UserRole } from '../../../../utils/enums';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UnauthorizedErrorDto } from '@/helpers/message/unauthorized.response';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Candidate / Skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidate/skills')
export class SkillManagementController {
  constructor(private readonly service: SkillManagementService) {}

  @Post('admin/categories')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new skill category (Admin Only)' })
  @ApiResponse({ status: 201, type: CategoryResponseDto })
  @ApiBody({ type: CreateCategoryDto })
  async createCategory(@Body() dto: CreateCategoryDto) {
    const data = await this.service.createCategory(dto);
    return sendResult(HttpStatus.CREATED, 'Skill category created', data);
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
  async getAllCategories() {
    const data = await this.service.findAllCategories();
    return sendResult(HttpStatus.OK, 'Skill categories fetched', data);
  }

  @Post('admin/directory')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Register a new global skill (Admin Only)' })
  @ApiResponse({ status: 201, type: SkillResponseDto })
  @ApiBody({ type: CreateSkillDto })
  async createSkill(@Body() dto: CreateSkillDto) {
    const data = await this.service.createSkill(dto);
    return sendResult(HttpStatus.CREATED, 'Skill created', data);
  }

  @Get('directory')
  @ApiOperation({ summary: 'Query all skills available' })
  @ApiResponse({ status: 200, type: [SkillResponseDto] })
  async getGlobalDirectoryList() {
    const data = await this.service.findAllSkills();
    return sendResult(HttpStatus.OK, 'Skills fetched', data);
  }

  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Attach or update personal profile skills' })
  @ApiResponse({ status: 201, type: CandidateSkillResponseDto })
  @ApiBody({ type: AssignSkillDto })
  async linkSkillSelf(@Req() req, @Body() dto: AssignSkillDto) {
    const data = await this.service.assignSkillToCandidate(req.user.id, dto);
    return sendResult(HttpStatus.CREATED, 'Skill assigned', data);
  }

  @Get()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: 'Retrieve all assigned skills for active candidate context',
  })
  @ApiResponse({ status: 200, type: [CandidateSkillResponseDto] })
  async getMyActiveSkills(@Req() req) {
    const data = await this.service.getCandidateSkills(req.user.id);
    return sendResult(HttpStatus.OK, 'Skills fetched', data);
  }

  @Delete(':skillId')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Detach a skill off candidate profile identity' })
  @ApiParam({ name: 'skillId', format: 'uuid' })
  @ApiResponse({ status: 204 })
  removeMySkillLink(
    @Req() req,
    @Param('skillId', ParseUUIDPipe) skillId: string,
  ) {
    return this.service.removeSkillFromCandidate(req.user.id, skillId);
  }

  @Get(':candidateId')
  @ApiOperation({
    summary: 'Audit professional profile skills mapping by candidate ID',
  })
  @ApiParam({ name: 'candidateId', format: 'uuid' })
  @ApiResponse({ status: 200, type: [CandidateSkillResponseDto] })
  async inspectProfileSkills(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    const data = await this.service.getSkillsByCandidateProfileId(candidateId);
    return sendResult(HttpStatus.OK, 'Skills fetched', data);
  }
}
