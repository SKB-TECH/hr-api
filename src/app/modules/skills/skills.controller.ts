import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { sendResult } from '@/helpers/message/sendResult';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UserRole } from '@/utils/enums';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Master Skills Dictionary')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Add a new skill to the master dictionary (Admin/System)',
  })
  @ApiResponse({ status: 201, description: 'Skill successfully created' })
  @ApiResponse({ status: 409, description: 'Skill already exists' })
  async createSkill(@Body() createSkillDto: CreateSkillDto) {
    const data = await this.skillsService.createSkill(createSkillDto);
    return sendResult(HttpStatus.CREATED, 'Skill created', data);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all predefined skills (Used for Job/Candidate dropdowns)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an alphabetical list of all skills',
  })
  async findAllSkills(@Query('q') q?: string, @Query('limit') limit?: string) {
    const data = await this.skillsService.findAllSkills(q, Number(limit) || 30);
    return sendResult(HttpStatus.OK, 'Skills fetched', data);
  }
}
