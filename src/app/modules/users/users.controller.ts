import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UnauthorizedErrorDto } from '@/helpers/message/unauthorized.response';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('email')
  @ApiOperation({ summary: 'Update email address' })
  @ApiBody({ type: UpdateEmailDto })
  @ApiResponse({ status: 200, description: 'Email updated successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateEmail(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateEmailDto,
  ) {
    const data = await this.usersService.updateEmail(user.id, dto);
    return sendResult(HttpStatus.OK, 'Email updated', data);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Old password is incorrect or OAuth account',
    type: UnauthorizedErrorDto,
  })
  async updatePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdatePasswordDto,
  ) {
    const data = await this.usersService.updatePassword(user.id, dto);
    return sendResult(HttpStatus.OK, 'Password changed', data);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close account (soft delete)' })
  @ApiResponse({ status: 200, description: 'Account closed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async closeAccount(@CurrentUser() user: { id: string }) {
    const data = await this.usersService.closeAccount(user.id);
    return sendResult(HttpStatus.OK, 'Account closed', data);
  }
}
