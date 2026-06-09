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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('email')
  @ApiOperation({ summary: 'Update email address' })
  @ApiResponse({ status: 200, description: 'Email updated successfully' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  updateEmail(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateEmailDto,
  ) {
    return this.usersService.updateEmail(user.id, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Old password is incorrect' })
  updatePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(user.id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close account (soft delete)' })
  @ApiResponse({ status: 200, description: 'Account closed successfully' })
  closeAccount(@CurrentUser() user: { id: string }) {
    return this.usersService.closeAccount(user.id);
  }
}
