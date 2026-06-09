import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';

@ApiTags('Master Skills Dictionary')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new skill to the master dictionary (Admin/System)' })
  @ApiResponse({ status: 201, description: 'Skill successfully created' })
  @ApiResponse({ status: 409, description: 'Skill already exists' })
  createSkill(@Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.createSkill(createSkillDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all predefined skills (Used for Job/Candidate dropdowns)' })
  @ApiResponse({ status: 200, description: 'Returns an alphabetical list of all skills' })
  findAllSkills() {
    return this.skillsService.findAllSkills();
  }
}
