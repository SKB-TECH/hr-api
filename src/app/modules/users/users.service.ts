import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus, ProfileVisibility } from '@/utils/enums';
import { User } from './entities/user.entity';
import { CandidateProfile } from '../candidate/candidate-profile/entities/candidate-profile.entity';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { JwtTokenService } from '@/libs/jwt/jwt-token.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepo: Repository<CandidateProfile>,
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(data: Partial<User> & { role: UserRole }): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const profileRepo = manager.getRepository(CandidateProfile);

      const profile =
        data.role === UserRole.CANDIDATE ? 'CANDIDATE' : 'COMPANY';
      const user = userRepo.create({
        ...data,
        profiles: data.profiles ?? [profile],
        activeProfile: data.activeProfile ?? profile,
      });
      const saved = await userRepo.save(user);

      if (data.role === UserRole.CANDIDATE) {
        const profile = profileRepo.create({
          userId: saved.id,
          openToWork: true,
          profileVisibility: ProfileVisibility.public,
        });
        await profileRepo.save(profile);
      }

      return saved;
    });
  }

  async enableProfile(userId: string, profile: 'CANDIDATE' | 'COMPANY') {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const profileRepo = manager.getRepository(CandidateProfile);
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      const profiles = user.profiles?.length
        ? user.profiles
        : user.role === UserRole.CANDIDATE
          ? ['CANDIDATE' as const]
          : ['COMPANY' as const];
      if (!profiles.includes(profile)) user.profiles = [...profiles, profile];
      if (profile === 'COMPANY' && user.role === UserRole.CANDIDATE)
        user.role = UserRole.COMPANY_OWNER;
      if (
        profile === 'CANDIDATE' &&
        !(await profileRepo.findOne({ where: { userId } }))
      ) {
        await profileRepo.save(
          profileRepo.create({
            userId,
            openToWork: true,
            profileVisibility: ProfileVisibility.public,
          }),
        );
      }
      return userRepo.save(user);
    });
  }

  async createPendingUser(data: {
    fullName: string;
    email: string;
    role?: UserRole;
  }): Promise<User> {
    return this.create({
      email: data.email,
      fullName: data.fullName,
      role: data.role ?? UserRole.CANDIDATE,
      status: UserStatus.pending,
      emailVerified: true,
    });
  }

  async activateUser(userId: string, hashedPassword: string): Promise<User> {
    await this.userRepo.update(userId, {
      password: hashedPassword,
      status: UserStatus.active,
    });
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepo.update(id, data);
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateEmail(userId: string, dto: UpdateEmailDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing && existing.id !== userId)
      throw new ConflictException('Email already in use');

    const current = await this.findById(userId);

    const user = await this.update(userId, {
      email: dto.email,
      emailVerified: false,
    });

    void this.auditLogService.log({
      userId,
      action: 'UPDATE_EMAIL',
      module: 'users',
      oldValues: { email: current?.email },
      newValues: { email: dto.email },
    });

    const { password: _password, ...safe } = user;
    return safe;
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.password)
      throw new UnauthorizedException(
        'Cannot change password for OAuth accounts',
      );

    const valid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!valid) throw new UnauthorizedException('Old password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.update(userId, { password: hashed });

    void this.auditLogService.log({
      userId,
      action: 'UPDATE_PASSWORD',
      module: 'users',
    });

    return { success: true };
  }

  async closeAccount(userId: string) {
    await this.jwtTokenService.revokeRefreshToken(userId);
    await this.update(userId, {
      status: UserStatus.deleted,
      deletedAt: new Date(),
    });

    void this.auditLogService.log({
      userId,
      action: 'CLOSE_ACCOUNT',
      module: 'users',
    });

    return { success: true };
  }
}
