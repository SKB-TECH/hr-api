import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { HeroRepository } from '../repositories/hero.repository';
import { CreateHeroDto } from '../dto/create-hero.dto';
import { CloudinaryService } from '../../../infrastructure/cloudinary/cloudinary.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class HeroService {
  constructor(
    private heroRepository: HeroRepository,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(createHeroDto: CreateHeroDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const uploadResult = await this.cloudinaryService.uploadImage(file);

    const data: Prisma.HeroImageCreateInput = {
      secureUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      isActive: createHeroDto.isActive !== undefined ? Boolean(createHeroDto.isActive) : true,
    };

    return this.heroRepository.create(data);
  }

  async findAll() {
    return this.heroRepository.findAll();
  }

  async findActive() {
    const hero = await this.heroRepository.findActive();
    if (!hero) {
      throw new NotFoundException('No active hero image found');
    }
    return hero;
  }

  async update(id: string, updateHeroDto: CreateHeroDto, file?: Express.Multer.File) {
    const existingHero = await this.heroRepository.findOne({ id });
    if (!existingHero) {
      throw new NotFoundException(`Hero image with ID ${id} not found`);
    }

    const data: Prisma.HeroImageUpdateInput = {};

    if (file) {
      const uploadResult = await this.cloudinaryService.replaceImage(file, existingHero.publicId);
      data.secureUrl = uploadResult.secure_url;
      data.publicId = uploadResult.public_id;
    }

    if (updateHeroDto.isActive !== undefined) {
      data.isActive = Boolean(updateHeroDto.isActive);
    }

    return this.heroRepository.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const existingHero = await this.heroRepository.findOne({ id });
    if (!existingHero) {
      throw new NotFoundException(`Hero image with ID ${id} not found`);
    }

    await this.cloudinaryService.deleteImage(existingHero.publicId);
    return this.heroRepository.remove({ id });
  }
}
