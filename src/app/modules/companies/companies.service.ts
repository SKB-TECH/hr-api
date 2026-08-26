import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { Company } from './entities/company.entity';
import { CompanyMember } from './entities/company-member.entity';
import { PaginationDto, paginate } from '../../../helpers/pagination';
import { CompanyTeamMember } from './entities/company-team-member.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateCompanyTeamMemberDto,
  UpdateCompanyTeamMemberDto,
} from './dto/company-team-member.dto';
import {
  AddCompanyMemberDto,
  UpdateCompanyMemberDto,
} from './dto/company-member.dto';
import { UserRole } from '../../../utils/enums';
import { CompanyInvitation } from './entities/company-invitation.entity';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../../../libs/mail/mail.service';
import { ConfigService } from '../../../libs/env/config.service';
import { StorageService } from '../../../libs/storage/storage.service';
import { CompanyNotificationPreference } from './entities/company-notification-preference.entity';
import { UpdateCompanyNotificationPreferencesDto } from './dto/company-notification-preferences.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyMember)
    private readonly companyMemberRepo: Repository<CompanyMember>,
    @InjectRepository(CompanyTeamMember)
    private readonly teamMemberRepo: Repository<CompanyTeamMember>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CompanyInvitation)
    private readonly invitationRepo: Repository<CompanyInvitation>,
    @InjectRepository(CompanyNotificationPreference)
    private readonly notificationPreferenceRepo: Repository<CompanyNotificationPreference>,
    private readonly dataSource: DataSource,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly storage: StorageService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const companyRepo = manager.getRepository(Company);
      const memberRepo = manager.getRepository(CompanyMember);

      const slugBase = createCompanyDto.name
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const duplicateSlug = await companyRepo.findOne({
        where: { slug: slugBase },
      });
      const company = await companyRepo.save(
        companyRepo.create({
          ...createCompanyDto,
          slug: duplicateSlug ? `${slugBase}-${Date.now()}` : slugBase,
        }),
      );

      await memberRepo.update({ userId, isActive: true }, { isActive: false });

      await memberRepo.save(
        memberRepo.create({
          userId,
          companyId: company.id,
          role: 'COMPANY_OWNER',
          isActive: true,
        }),
      );

      return company;
    });
  }

  async findAll(query: QueryCompanyDto = {}) {
    const {
      search,
      location,
      industry,
      companySize,
      page = 1,
      limit = 12,
    } = query;

    const qb = this.companyRepo
      .createQueryBuilder('company')
      .where("company.visibility = 'public'")
      .andWhere("company.status = 'active'");

    if (search) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('company.name ILIKE :search', {
            search: `%${search}%`,
          }).orWhere('company.description ILIKE :search', {
            search: `%${search}%`,
          });
        }),
      );
    }

    if (location) {
      qb.andWhere(
        `(company.location ILIKE :location OR EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(company.locations) AS office(value)
          WHERE office.value ILIKE :location
        ))`,
        { location: `%${location}%` },
      );
    }

    if (industry) {
      qb.andWhere('company.industry ILIKE :industry', {
        industry: `%${industry}%`,
      });
    }

    if (companySize) {
      qb.andWhere('company.companySize = :companySize', { companySize });
    }

    qb.orderBy('company.createdAt', 'DESC');

    return paginate(qb, { page, limit } as PaginationDto);
  }

  async findOne(id: string) {
    const company = await this.companyRepo.findOne({
      where: { id, visibility: 'public', status: 'active' },
      relations: { teamMembers: true },
      order: { teamMembers: { displayOrder: 'ASC' } },
    });

    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findMine(userId: string) {
    let membership = await this.companyMemberRepo.findOne({
      where: { userId, isActive: true },
    });
    if (!membership) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.COMPANY_OWNER) {
        throw new NotFoundException('User is not assigned to a company');
      }

      await this.create({ name: `${user.fullName} Company` }, userId);
      membership = await this.companyMemberRepo.findOne({
        where: { userId, isActive: true },
      });
      if (!membership)
        throw new NotFoundException('Company provisioning failed');
    }
    const company = await this.companyRepo.findOne({
      where: { id: membership.companyId },
      relations: { teamMembers: true },
      order: { teamMembers: { displayOrder: 'ASC' } },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async findMyCompanies(userId: string) {
    return this.companyMemberRepo.find({
      where: { userId },
      relations: { company: true },
      order: { joinedAt: 'ASC' },
    });
  }

  async switchActiveCompany(companyId: string, userId: string) {
    await this.assertMember(companyId, userId);
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(CompanyMember);
      await repo.update({ userId, isActive: true }, { isActive: false });
      await repo.update({ userId, companyId }, { isActive: true });
    });
    return this.findMine(userId);
  }

  async notificationPreferences(companyId: string, userId: string) {
    await this.assertMember(companyId, userId);
    let preferences = await this.notificationPreferenceRepo.findOne({
      where: { companyId, userId },
    });
    if (!preferences)
      preferences = await this.notificationPreferenceRepo.save(
        this.notificationPreferenceRepo.create({ companyId, userId }),
      );
    return preferences;
  }

  async updateNotificationPreferences(
    companyId: string,
    userId: string,
    dto: UpdateCompanyNotificationPreferencesDto,
  ) {
    const preferences = await this.notificationPreferences(companyId, userId);
    return this.notificationPreferenceRepo.save({ ...preferences, ...dto });
  }

  async update(id: string, userId: string, updateCompanyDto: UpdateCompanyDto) {
    await this.assertCanManage(id, userId);

    await this.companyRepo.update(id, updateCompanyDto);
    return this.companyRepo.findOne({ where: { id } });
  }

  async updateBranding(
    companyId: string,
    userId: string,
    files: {
      logoFile?: Express.Multer.File[];
      coverFile?: Express.Multer.File[];
    },
  ) {
    await this.assertCanManage(companyId, userId);
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    const logoFile = files.logoFile?.[0];
    const coverFile = files.coverFile?.[0];
    if (!logoFile && !coverFile)
      throw new BadRequestException('logoFile or coverFile is required');
    for (const file of [logoFile, coverFile].filter(Boolean)) {
      if (!file!.mimetype.startsWith('image/'))
        throw new BadRequestException('Only image uploads are allowed');
    }
    const [logo, cover] = await Promise.all([
      logoFile
        ? this.storage.uploadImage(logoFile, 'companies/logos', userId)
        : null,
      coverFile
        ? this.storage.uploadImage(coverFile, 'companies/covers', userId)
        : null,
    ]);
    const previousLogo = company.logo;
    const previousCover = company.coverImage;
    if (logo) company.logo = logo.url;
    if (cover) company.coverImage = cover.url;
    const saved = await this.companyRepo.save(company);
    await Promise.all([
      logo && previousLogo
        ? this.storage.deleteByUrl(previousLogo).catch(() => undefined)
        : undefined,
      cover && previousCover
        ? this.storage.deleteByUrl(previousCover).catch(() => undefined)
        : undefined,
    ]);
    return saved;
  }

  async listMembers(companyId: string, userId: string) {
    await this.assertMember(companyId, userId);
    return this.companyMemberRepo.find({
      where: { companyId },
      relations: { user: true },
      select: {
        id: true,
        role: true,
        title: true,
        joinedAt: true,
        companyId: true,
        userId: true,
        user: { id: true, fullName: true, email: true, avatar: true },
      },
      order: { joinedAt: 'ASC' },
    });
  }

  async addMember(
    companyId: string,
    actorId: string,
    dto: AddCompanyMemberDto,
  ) {
    await this.assertCanManage(companyId, actorId);
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) return this.createInvitation(companyId, actorId, dto);
    const existing = await this.companyMemberRepo.findOne({
      where: { userId: user.id },
    });
    if (existing)
      throw new ConflictException('User already belongs to a company');
    const membership = await this.companyMemberRepo.save(
      this.companyMemberRepo.create({
        companyId,
        userId: user.id,
        role: dto.role,
        title: dto.title ?? null,
      }),
    );
    await this.userRepo.update(user.id, { role: dto.role as UserRole });
    return membership;
  }

  async listInvitations(companyId: string, actorId: string) {
    await this.assertCanManage(companyId, actorId);
    return this.invitationRepo.find({
      where: { companyId },
      select: {
        id: true,
        email: true,
        fullName: true,
        title: true,
        role: true,
        status: true,
        expiresAt: true,
        createdAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async acceptInvitation(token: string, userId: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invitation = await this.invitationRepo.findOne({
      where: { tokenHash, status: 'pending' },
    });
    if (!invitation) throw new NotFoundException('Invitation is invalid');
    if (invitation.expiresAt.getTime() <= Date.now()) {
      invitation.status = 'expired';
      await this.invitationRepo.save(invitation);
      throw new ForbiddenException('Invitation has expired');
    }
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invitation.email.toLowerCase())
      throw new ForbiddenException('Invitation belongs to another email');
    const existing = await this.companyMemberRepo.findOne({
      where: { userId, companyId: invitation.companyId },
    });
    if (!existing)
      await this.companyMemberRepo.save(
        this.companyMemberRepo.create({
          companyId: invitation.companyId,
          userId,
          role: invitation.role,
          title: invitation.title,
          isActive: !(await this.companyMemberRepo.exist({
            where: { userId },
          })),
        }),
      );
    invitation.status = 'accepted';
    await this.invitationRepo.save(invitation);
    await this.userRepo.update(userId, { role: invitation.role as UserRole });
    return { companyId: invitation.companyId, accepted: true };
  }

  async revokeInvitation(
    companyId: string,
    invitationId: string,
    actorId: string,
  ) {
    await this.assertCanManage(companyId, actorId);
    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId, companyId, status: 'pending' },
    });
    if (!invitation)
      throw new NotFoundException('Pending invitation not found');
    invitation.status = 'revoked';
    await this.invitationRepo.save(invitation);
    return { revoked: true, invitationId };
  }

  async updateMember(
    companyId: string,
    memberId: string,
    actorId: string,
    dto: UpdateCompanyMemberDto,
  ) {
    await this.assertCanManage(companyId, actorId);
    const member = await this.companyMemberRepo.findOne({
      where: { id: memberId, companyId },
    });
    if (!member) throw new NotFoundException('Company member not found');
    if (member.role === 'COMPANY_OWNER')
      throw new ForbiddenException('Company owner role cannot be changed');
    Object.assign(member, dto);
    const saved = await this.companyMemberRepo.save(member);
    if (dto.role)
      await this.userRepo.update(member.userId, {
        role: dto.role as UserRole,
      });
    return saved;
  }

  async removeMember(companyId: string, memberId: string, actorId: string) {
    await this.assertCanManage(companyId, actorId);
    const member = await this.companyMemberRepo.findOne({
      where: { id: memberId, companyId },
    });
    if (!member) throw new NotFoundException('Company member not found');
    if (member.role === 'COMPANY_OWNER')
      throw new ForbiddenException('Company owner cannot be removed');
    await this.companyMemberRepo.remove(member);
    return { deleted: true, memberId };
  }

  async addTeamMember(
    companyId: string,
    userId: string,
    dto: CreateCompanyTeamMemberDto,
  ) {
    await this.assertCanManage(companyId, userId);
    return this.teamMemberRepo.save(
      this.teamMemberRepo.create({ ...dto, companyId }),
    );
  }

  async updateTeamMember(
    companyId: string,
    teamMemberId: string,
    userId: string,
    dto: UpdateCompanyTeamMemberDto,
  ) {
    await this.assertCanManage(companyId, userId);
    const member = await this.teamMemberRepo.findOne({
      where: { id: teamMemberId, companyId },
    });
    if (!member) throw new NotFoundException('Public team member not found');
    Object.assign(member, dto);
    return this.teamMemberRepo.save(member);
  }

  async removeTeamMember(
    companyId: string,
    teamMemberId: string,
    userId: string,
  ) {
    await this.assertCanManage(companyId, userId);
    const member = await this.teamMemberRepo.findOne({
      where: { id: teamMemberId, companyId },
    });
    if (!member) throw new NotFoundException('Public team member not found');
    await this.teamMemberRepo.remove(member);
    return { deleted: true, teamMemberId };
  }

  async deactivate(companyId: string, userId: string, reason: string) {
    await this.assertOwner(companyId, userId);
    await this.companyRepo.update(companyId, {
      status: 'deactivated',
      deactivationReason: reason,
      deletionScheduledAt: null,
    });
    return { companyId, status: 'deactivated' };
  }

  async reactivate(companyId: string, userId: string) {
    await this.assertOwner(companyId, userId);
    await this.companyRepo.update(companyId, {
      status: 'active',
      deactivationReason: null,
      deletionScheduledAt: null,
    });
    return { companyId, status: 'active' };
  }

  async scheduleDeletion(companyId: string, userId: string, reason: string) {
    await this.assertOwner(companyId, userId);
    const deletionScheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.companyRepo.update(companyId, {
      status: 'deletion_scheduled',
      deactivationReason: reason,
      deletionScheduledAt,
    });
    return { companyId, status: 'deletion_scheduled', deletionScheduledAt };
  }

  private async membershipForUser(userId: string) {
    const membership = await this.companyMemberRepo.findOne({
      where: { userId, isActive: true },
    });
    if (!membership)
      throw new NotFoundException('User is not assigned to a company');
    return membership;
  }

  private async assertMember(companyId: string, userId: string) {
    const membership = await this.companyMemberRepo.findOne({
      where: { companyId, userId },
    });
    if (!membership) throw new ForbiddenException('Company access denied');
    return membership;
  }

  private async assertCanManage(companyId: string, userId: string) {
    const membership = await this.assertMember(companyId, userId);
    if (!['COMPANY_OWNER', 'HR_MANAGER'].includes(membership.role))
      throw new ForbiddenException('Company management permission required');
    return membership;
  }

  private async assertOwner(companyId: string, userId: string) {
    const membership = await this.assertMember(companyId, userId);
    if (membership.role !== 'COMPANY_OWNER')
      throw new ForbiddenException('Company owner permission required');
    return membership;
  }

  private async createInvitation(
    companyId: string,
    actorId: string,
    dto: AddCompanyMemberDto,
  ) {
    const existing = await this.invitationRepo.findOne({
      where: { companyId, email: dto.email.toLowerCase(), status: 'pending' },
    });
    if (existing)
      throw new ConflictException('A pending invitation already exists');
    const [company, inviter] = await Promise.all([
      this.companyRepo.findOne({ where: { id: companyId } }),
      this.userRepo.findOne({ where: { id: actorId } }),
    ]);
    if (!company || !inviter)
      throw new NotFoundException('Invitation context not found');
    const token = randomBytes(32).toString('base64url');
    const invitation = await this.invitationRepo.save(
      this.invitationRepo.create({
        companyId,
        email: dto.email.toLowerCase(),
        fullName: dto.fullName ?? null,
        title: dto.title ?? null,
        role: dto.role,
        invitedBy: actorId,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    );
    const baseUrl = this.config.get('WEB_APP_URL').replace(/\/$/, '');
    await this.mail.sendCompanyInvitation(
      invitation.email,
      company.name,
      inviter.fullName,
      `${baseUrl}/company/invitations/accept?token=${encodeURIComponent(token)}`,
    );
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    };
  }
}
