import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  async updateEmail(userId: string, dto: UpdateEmailDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing && existing.id !== userId)
      throw new ConflictException('Email already in use');

    const current = await this.usersRepository.findById(userId);

    const user = await this.usersRepository.update(userId, {
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
    const user = await this.usersRepository.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.password)
      throw new UnauthorizedException(
        'Cannot change password for OAuth accounts',
      );

    const valid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!valid) throw new UnauthorizedException('Old password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.usersRepository.update(userId, { password: hashed });

    void this.auditLogService.log({
      userId,
      action: 'UPDATE_PASSWORD',
      module: 'users',
    });

    return { success: true };
  }

  async closeAccount(userId: string) {
    await this.usersRepository.deleteRefreshTokens(userId);
    await this.usersRepository.update(userId, {
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
