import { Body, Controller, Get, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { sendResult } from '@/helpers/message/sendResult';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Messages') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('messages')
export class MessagesController {
  constructor(private readonly service: MessagesService) {}
  @Get() @ApiOperation({ summary: 'List my conversations and message history' })
  async list(@CurrentUser() user: { id: string; activeProfile?: string }) { return sendResult(HttpStatus.OK, 'Conversations fetched', await this.service.list(user)); }
  @Post('conversations') @ApiOperation({ summary: 'Company starts a candidate conversation, optionally proposing a job' })
  async create(@Body() dto: CreateConversationDto, @CurrentUser() user: { id: string }) { return sendResult(HttpStatus.CREATED, 'Conversation created', await this.service.create(dto, user.id)); }
  @Get('socket-token') @ApiOperation({ summary: 'Create a short-lived Socket.IO authentication token' })
  token(@CurrentUser() user: { id: string; activeProfile?: string }) { return sendResult(HttpStatus.OK, 'Socket token created', { token: this.service.issueSocketToken(user) }); }
  @Get(':id') async one(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) { return sendResult(HttpStatus.OK, 'Conversation fetched', await this.service.getOne(id, user.id)); }
  @Post(':id') async send(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SendMessageDto, @CurrentUser() user: { id: string }) { return sendResult(HttpStatus.CREATED, 'Message sent', await this.service.send(id, dto, user.id)); }
  @Patch(':id/read') async read(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: { id: string }) { return sendResult(HttpStatus.OK, 'Conversation marked as read', await this.service.markRead(id, user.id)); }
}
