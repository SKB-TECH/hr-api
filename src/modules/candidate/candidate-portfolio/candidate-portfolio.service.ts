import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';
import { CreatePortfolioDto } from './dto/create-candidate-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-candidate-portfolio.dto';
import { plainToInstance } from 'class-transformer';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private serialize(data: any | any[]): any {
    return plainToInstance(PortfolioResponseDto, data, { excludeExtraneousValues: true });
  }

  async create(userId: string, dto: CreatePortfolioDto, file: Express.Multer.File): Promise<PortfolioResponseDto> {
    if (!file) {
      throw new BadRequestException('A project thumbnail image file upload is required.');
    }

    const profile = await this.prisma.candidateProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Candidate profile context missing.');

    // Fire Cloudinary asset upload stream asynchronously
    const uploadResult = await this.cloudinaryService.uploadImage(file);

    const portfolio = await this.prisma.candidatePortfolio.create({
      data: {
        candidateId: profile.id,
        title: dto.title,
        description: dto.description,
        projectUrl: dto.projectUrl,
        thumbnailUrl: uploadResult.secure_url, // Map the secure cloud link here
      },
    });

    return this.serialize(portfolio);
  }

  async findAll(userId: string): Promise<PortfolioResponseDto[]> {
    const profile = await this.prisma.candidateProfile.findUnique({
      where: { userId },
      include: { candidatePortfolios: { orderBy: { createdAt: 'desc' } } },
    });
    if (!profile) throw new NotFoundException('Candidate profile context missing.');

    return this.serialize(profile.candidatePortfolios);
  }

  async update(id: string, userId: string, dto: UpdatePortfolioDto, file?: Express.Multer.File): Promise<PortfolioResponseDto> {
    const portfolio = await this.prisma.candidatePortfolio.findUnique({
      where: { id },
      include: { candidate: true },
    });

    if (!portfolio) throw new NotFoundException('Portfolio item record missing.');
    if (portfolio.candidate.userId !== userId) throw new ForbiddenException('Access to modify this object is denied.');

    let dynamicThumbnailUrl = portfolio.thumbnailUrl;

    // If candidate provides a new image replacement, overwrite the track URL reference
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      dynamicThumbnailUrl = uploadResult.secure_url;
    }

    const updated = await this.prisma.candidatePortfolio.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        projectUrl: dto.projectUrl,
        thumbnailUrl: dynamicThumbnailUrl,
      },
    });

    return this.serialize(updated);
  }

  async remove(id: string, userId: string) {
    const portfolio = await this.prisma.candidatePortfolio.findUnique({
      where: { id },
      include: { candidate: true },
    });

    if (!portfolio) throw new NotFoundException('Portfolio item record missing.');
    if (portfolio.candidate.userId !== userId) throw new ForbiddenException('Access to modify this object is denied.');

    await this.prisma.candidatePortfolio.delete({ where: { id } });
    return { success: true, message: 'Portfolio item deleted successfully.' };
  }
}