import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { CandidateProfile } from '../candidate/candidate-profile/entities/candidate-profile.entity';
import { AuditLogModule } from '../audit-logs/audit-log.module';
import { JwtTokenModule } from '@/libs/jwt/jwt-token.module';
import { Profession } from './entities/profession.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CandidateProfile, Profession]),
    AuditLogModule,
    JwtTokenModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
