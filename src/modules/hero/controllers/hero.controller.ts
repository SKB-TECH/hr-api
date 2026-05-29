import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { HeroService } from '../services/hero.service';
import { CreateHeroDto } from '../dto/create-hero.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';

@ApiTags('Hero Image')
@Controller('hero')
export class HeroController {
  constructor(private readonly heroService: HeroService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a new hero image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'The hero image has been successfully uploaded.' })
  create(@Body() createHeroDto: CreateHeroDto, @UploadedFile() file: Express.Multer.File) {
    return this.heroService.create(createHeroDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hero images' })
  findAll() {
    return this.heroService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the current active hero image' })
  findActive() {
    return this.heroService.findActive();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update/Replace a hero image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() updateHeroDto: CreateHeroDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.heroService.update(id, updateHeroDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a hero image' })
  remove(@Param('id') id: string) {
    return this.heroService.remove(id);
  }
}
