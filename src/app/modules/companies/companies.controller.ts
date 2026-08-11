import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
  Query,
  HttpStatus,
  Delete,
  ParseUUIDPipe,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { sendResult, sendPaginated } from '@/helpers/message/sendResult';
import {
  CreateCompanyTeamMemberDto,
  UpdateCompanyTeamMemberDto,
} from './dto/company-team-member.dto';
import {
  AcceptCompanyInvitationDto,
  AddCompanyMemberDto,
  UpdateCompanyMemberDto,
} from './dto/company-member.dto';
import { CompanyLifecycleReasonDto } from './dto/company-lifecycle.dto';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateCompanyDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.companiesService.create(dto, user.id);
    return sendResult(HttpStatus.CREATED, 'Company created', data);
  }

  @Get()
  @ApiOperation({
    summary: 'Browse companies with search, filter and pagination',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of companies' })
  async findAll(@Query() query: QueryCompanyDto) {
    const result = await this.companiesService.findAll(query);
    return sendPaginated(HttpStatus.OK, 'Companies fetched', result);
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user company profile' })
  async findMine(@CurrentUser() user: { id: string }) {
    const data = await this.companiesService.findMine(user.id);
    return sendResult(HttpStatus.OK, 'Company profile fetched', data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single company profile' })
  @ApiResponse({ status: 200, description: 'Company profile returned' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.companiesService.findOne(id);
    return sendResult(HttpStatus.OK, 'Company fetched', data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update company settings' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: { id: string },
  ) {
    const data = await this.companiesService.update(
      id,
      user.id,
      updateCompanyDto,
    );
    return sendResult(HttpStatus.OK, 'Company updated', data);
  }

  @Patch(':id/branding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logoFile', maxCount: 1 },
        { name: 'coverFile', maxCount: 1 },
      ],
      { limits: { fileSize: 5 * 1024 * 1024 } },
    ),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logoFile: { type: 'string', format: 'binary' },
        coverFile: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload company logo and/or cover image' })
  async updateBranding(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles()
    files: {
      logoFile?: Express.Multer.File[];
      coverFile?: Express.Multer.File[];
    },
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company branding updated',
      await this.companiesService.updateBranding(id, user.id, files),
    );
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List company access members' })
  async members(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company members fetched',
      await this.companiesService.listMembers(id, user.id),
    );
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a registered user to the company' })
  async addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddCompanyMemberDto,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.CREATED,
      'Company member added',
      await this.companiesService.addMember(id, user.id, dto),
    );
  }

  @Get(':id/invitations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List company membership invitations' })
  async invitations(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company invitations fetched',
      await this.companiesService.listInvitations(id, user.id),
    );
  }

  @Post('invitations/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a company invitation for my email' })
  async acceptInvitation(
    @Body() dto: AcceptCompanyInvitationDto,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company invitation accepted',
      await this.companiesService.acceptInvitation(dto.token, user.id),
    );
  }

  @Delete(':id/invitations/:invitationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a pending company invitation' })
  async revokeInvitation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company invitation revoked',
      await this.companiesService.revokeInvitation(id, invitationId, user.id),
    );
  }

  @Patch(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a company member role or title' })
  async updateMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: UpdateCompanyMemberDto,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company member updated',
      await this.companiesService.updateMember(id, memberId, user.id, dto),
    );
  }

  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a non-owner company member' })
  async removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company member removed',
      await this.companiesService.removeMember(id, memberId, user.id),
    );
  }

  @Post(':id/team')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a public company-profile team member' })
  async addTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCompanyTeamMemberDto,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.CREATED,
      'Public team member added',
      await this.companiesService.addTeamMember(id, user.id, dto),
    );
  }

  @Patch(':id/team/:teamMemberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a public company-profile team member' })
  async updateTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('teamMemberId', ParseUUIDPipe) teamMemberId: string,
    @Body() dto: UpdateCompanyTeamMemberDto,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Public team member updated',
      await this.companiesService.updateTeamMember(
        id,
        teamMemberId,
        user.id,
        dto,
      ),
    );
  }

  @Delete(':id/team/:teamMemberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a public company-profile team member' })
  async removeTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('teamMemberId', ParseUUIDPipe) teamMemberId: string,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Public team member removed',
      await this.companiesService.removeTeamMember(id, teamMemberId, user.id),
    );
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Temporarily deactivate the company account' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompanyLifecycleReasonDto,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company deactivated',
      await this.companiesService.deactivate(id, user.id, dto.reason),
    );
  }

  @Post(':id/reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate a deactivated company account' })
  async reactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company reactivated',
      await this.companiesService.reactivate(id, user.id),
    );
  }

  @Post(':id/deletion-schedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Schedule company deletion after a 30-day recovery period',
  })
  async scheduleDeletion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompanyLifecycleReasonDto,
    @CurrentUser() user: { id: string },
  ) {
    return sendResult(
      HttpStatus.OK,
      'Company deletion scheduled',
      await this.companiesService.scheduleDeletion(id, user.id, dto.reason),
    );
  }
}
