import { 
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, 
  ParseUUIDPipe, HttpCode, HttpStatus, UseInterceptors, UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PortfolioService } from './candidate-portfolio.service';
import { CreatePortfolioDto } from './dto/create-candidate-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-candidate-portfolio.dto';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UnauthorizedErrorDto} from '@/common/response/unauthorized.response';



@ApiTags('Candidate / Portfolios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('candidate/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data') // Informs OpenAPI to render a file selector option
  @ApiOperation({ summary: 'Create portfolio project card with Cloudinary thumbnail upload' })
  @ApiBody({ type: CreatePortfolioDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: PortfolioResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @UseInterceptors(FileInterceptor('thumbnail')) // Intercepts the binary 'thumbnail' stream parameter
  create(
    @Req() req: any, 
    @Body() createPortfolioDto: CreatePortfolioDto,
    @UploadedFile() file: Express.Multer.File
  ): Promise<PortfolioResponseDto> {
    return this.portfolioService.create(req.user.id, createPortfolioDto, file);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all portfolio entries belonging to logged-in candidate' })
  @ApiResponse({ status: HttpStatus.OK, type: [PortfolioResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  findAll(@Req() req: any): Promise<PortfolioResponseDto[]> {
    return this.portfolioService.findAll(req.user.id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Partially update an existing project entry (Optional image binary swap)' })
  @ApiParam({ name: 'id', description: 'The portfolio entry UUID identity tracking token' })
  @ApiBody({ type: UpdatePortfolioDto })
  @ApiResponse({ status: HttpStatus.OK, type: PortfolioResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @UseInterceptors(FileInterceptor('thumbnail'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
    @UploadedFile() file?: Express.Multer.File
  ): Promise<PortfolioResponseDto> {
    return this.portfolioService.update(id, req.user.id, updatePortfolioDto, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a portfolio entry record' })
    @ApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
  @ApiParam({ name: 'id', description: 'The portfolio entry UUID identity tracking token' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.portfolioService.remove(id, req.user.id);
  }
}