import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@/libs/env/config.module';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/message.entity';
import { CompanyMember } from '../companies/entities/company-member.entity';
import { User } from '../users/entities/user.entity';
import { Job } from '../jobs/entities/job.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';

@Module({ imports: [TypeOrmModule.forFeature([Conversation, ChatMessage, CompanyMember, User, Job]), JwtModule.register({}), ConfigModule], controllers: [MessagesController], providers: [MessagesService, MessagesGateway], exports: [MessagesService] })
export class MessagesModule {}
