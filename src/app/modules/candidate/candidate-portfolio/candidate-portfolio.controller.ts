import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { PortfolioService } from './candidate-portfolio.service';
import { CreatePortfolioDto } from './dto/create-candidate-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-candidate-portfolio.dto';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';
import { JwtAuthGuard } from '@/app/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/helpers/guards/roles.guard';
import { UnauthorizedErrorDto } from '@/helpers/message/unauthorized.response';
import { sendResult } from '@/helpers/message/sendResult';

@ApiTags('Candidate / Portfolios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidate/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create portfolio project card with thumbnail image upload',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        projectUrl: { type: 'string' },
        thumbnail: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['title', 'description', 'thumbnail'],
    },
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: PortfolioResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/webp',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only image files are allowed.'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async create(
    @Req() req: any,
    @Body() createPortfolioDto: CreatePortfolioDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Thumbnail image is required.');
    }

    const data = await this.portfolioService.create(
      req.user.id,
      createPortfolioDto,
      file,
    );
    return sendResult(HttpStatus.CREATED, 'Portfolio created', data);
  }

  @Get('public/:candidateId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Public recruiter view of candidate portfolios by candidateId',
  })
  @ApiParam({
    name: 'candidateId',
    description: 'Candidate profile UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [PortfolioResponseDto],
  })
  async findPublicByCandidateId(
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    const data =
      await this.portfolioService.findPublicByCandidateId(candidateId);
    return sendResult(HttpStatus.OK, 'Portfolios fetched', data);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all portfolio entries belonging to logged-in candidate',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [PortfolioResponseDto] })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  async findAll(@Req() req: any) {
    const data = await this.portfolioService.findAll(req.user.id);
    return sendResult(HttpStatus.OK, 'Portfolios fetched', data);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Partially update an existing project entry (Optional image binary swap)',
  })
  @ApiParam({
    name: 'id',
    description: 'The portfolio entry UUID identity tracking token',
  })
  @ApiBody({ type: UpdatePortfolioDto })
  @ApiResponse({ status: HttpStatus.OK, type: PortfolioResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  @UseInterceptors(FileInterceptor('thumbnail'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const data = await this.portfolioService.update(
      id,
      req.user.id,
      updatePortfolioDto,
      file,
    );
    return sendResult(HttpStatus.OK, 'Portfolio updated', data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a portfolio entry record' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorDto,
  })
  @ApiParam({
    name: 'id',
    description: 'The portfolio entry UUID identity tracking token',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const data = await this.portfolioService.remove(id, req.user.id);
    return sendResult(HttpStatus.OK, 'Portfolio deleted', data);
  }
}
