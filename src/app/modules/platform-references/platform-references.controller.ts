import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { Roles } from '@/helpers/decorators/roles.decorator';
import { UserRole } from '@/utils/enums';
import { sendResult } from '@/helpers/message/sendResult';
import {
  CreatePlatformReferenceDto,
  ReferenceQueryDto,
} from './dto/platform-reference.dto';
import { PlatformReferenceType } from './entities/platform-reference.entity';
import { PlatformReferencesService } from './platform-references.service';

@ApiTags('Platform References')
@Controller('references')
export class PlatformReferencesController {
  constructor(private readonly service: PlatformReferencesService) {}

  @Get(':type')
  @ApiOperation({ summary: 'Search an autocomplete reference list' })
  async list(
    @Param('type', new ParseEnumPipe(PlatformReferenceType))
    type: PlatformReferenceType,
    @Query() query: ReferenceQueryDto,
  ) {
    const data = await this.service.list(type, query.q, query.limit, false);
    return sendResult(HttpStatus.OK, 'References fetched', data);
  }

  @Post('admin/:type')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create or update a reference item (Admin)' })
  async upsert(
    @Param('type', new ParseEnumPipe(PlatformReferenceType))
    type: PlatformReferenceType,
    @Body() dto: CreatePlatformReferenceDto,
  ) {
    const data = await this.service.upsert(type, dto);
    return sendResult(HttpStatus.OK, 'Reference saved', data);
  }

  @Delete('admin/items/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Disable a reference item (Admin)' })
  async disable(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.service.disable(id);
    return sendResult(HttpStatus.OK, 'Reference disabled', data);
  }

  @Post('admin/import/excel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Import skills, countries, job categories and benefits from Excel',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async importExcel(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Excel file is required');
    if (!/\.(xlsx|xls)$/i.test(file.originalname)) {
      throw new BadRequestException('Only .xlsx and .xls files are accepted');
    }
    const data = await this.service.importWorkbook(file);
    return sendResult(HttpStatus.OK, 'Reference workbook imported', data);
  }
}
