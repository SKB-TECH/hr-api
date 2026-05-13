import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AboutService } from './about.service';
import { UpdateHeroDto } from './dto/hero.dto';
import { UpdateCeoDto } from './dto/ceo.dto';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './dto/team-member.dto';
import { CreateContactDto } from './dto/contact-form.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { ApiResponse } from '../../common/response/api-response';

@Controller('api/about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  // ── PUBLIC ────────────────────────────────────────────────────────────────

  @Get('hero')
  async getHero() {
    const data = await this.aboutService.getHero();
    return ApiResponse.ok(data);
  }

  @Get('ceo')
  async getCeo() {
    const data = await this.aboutService.getCeo();
    return ApiResponse.ok(data);
  }

  @Get('team')
  async getTeam() {
    const data = await this.aboutService.getTeam();
    return ApiResponse.ok(data);
  }

  @Post('contact')
  @HttpCode(HttpStatus.CREATED)
  async submitContact(@Body() dto: CreateContactDto) {
    await this.aboutService.submitContact(dto);
    return ApiResponse.created(null, 'Your inquiry has been received. We will get back to you soon.');
  }

  // ── ADMIN ─────────────────────────────────────────────────────────────────

  @Put('hero')
  @UseGuards(AdminGuard)
  async updateHero(@Body() dto: UpdateHeroDto) {
    const data = await this.aboutService.updateHero(dto);
    return ApiResponse.ok(data, 'Hero updated successfully');
  }

  @Put('ceo')
  @UseGuards(AdminGuard)
  async updateCeo(@Body() dto: UpdateCeoDto) {
    const data = await this.aboutService.updateCeo(dto);
    return ApiResponse.ok(data, 'CEO section updated successfully');
  }

  @Post('team')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createTeamMember(@Body() dto: CreateTeamMemberDto) {
    const data = await this.aboutService.createTeamMember(dto);
    return ApiResponse.created(data, 'Team member created successfully');
  }

  @Put('team/:id')
  @UseGuards(AdminGuard)
  async updateTeamMember(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    const data = await this.aboutService.updateTeamMember(id, dto);
    return ApiResponse.ok(data, 'Team member updated successfully');
  }

  @Delete('team/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async deleteTeamMember(@Param('id') id: string) {
    await this.aboutService.deleteTeamMember(id);
    return ApiResponse.ok(null, 'Team member deleted successfully');
  }
}
