import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageService } from '@/libs/storage/storage.service';
import { CreatePortfolioDto } from './dto/create-candidate-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-candidate-portfolio.dto';
import { plainToInstance } from 'class-transformer';
import { PortfolioResponseDto } from './dto/portfolio-response.dto';
import { CandidatePortfolio } from './entities/candidate-portfolio.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(CandidatePortfolio)
    private readonly candidatePortfolioRepo: Repository<CandidatePortfolio>,
    @InjectRepository(CandidateProfile)
    private readonly candidateProfileRepo: Repository<CandidateProfile>,
    private readonly storage: StorageService,
  ) {}

  private serialize(data: any | any[]): any {
    return plainToInstance(PortfolioResponseDto, data, {
      excludeExtraneousValues: true,
    });
  }

  async create(
    userId: string,
    dto: CreatePortfolioDto,
    file: Express.Multer.File,
  ): Promise<PortfolioResponseDto> {
    if (!file) {
      throw new BadRequestException(
        'A project thumbnail image file upload is required.',
      );
    }

    const profile = await this.candidateProfileRepo.findOne({
      where: { userId },
    });
    if (!profile)
      throw new NotFoundException('Candidate profile context missing.');

    const uploadResult = await this.storage.uploadImage(
      file,
      'portfolios',
      profile.id,
    );

    const portfolio = this.candidatePortfolioRepo.create({
      candidateId: profile.id,
      title: dto.title,
      description: dto.description,
      projectUrl: dto.projectUrl,
      thumbnailUrl: uploadResult.url,
    });
    const saved = await this.candidatePortfolioRepo.save(portfolio);

    return this.serialize(saved);
  }

  async findAll(userId: string): Promise<PortfolioResponseDto[]> {
    const profile = await this.candidateProfileRepo.findOne({
      where: { userId },
    });
    if (!profile)
      throw new NotFoundException('Candidate profile context missing.');

    const portfolios = await this.candidatePortfolioRepo.find({
      where: { candidateId: profile.id },
      order: { createdAt: 'DESC' },
    });

    return this.serialize(portfolios);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePortfolioDto,
    file?: Express.Multer.File,
  ): Promise<PortfolioResponseDto> {
    const portfolio = await this.candidatePortfolioRepo.findOne({
      where: { id },
      relations: { candidate: true },
    });

    if (!portfolio)
      throw new NotFoundException('Portfolio item record missing.');
    if (portfolio.candidate.userId !== userId)
      throw new ForbiddenException('Access to modify this object is denied.');

    let dynamicThumbnailUrl = portfolio.thumbnailUrl;
    const previousThumbnailUrl = portfolio.thumbnailUrl;

    if (file) {
      const uploadResult = await this.storage.uploadImage(
        file,
        'portfolios',
        portfolio.candidateId,
      );
      dynamicThumbnailUrl = uploadResult.url;
    }

    this.candidatePortfolioRepo.merge(portfolio, {
      title: dto.title,
      description: dto.description,
      projectUrl: dto.projectUrl,
      thumbnailUrl: dynamicThumbnailUrl,
    });
    const updated = await this.candidatePortfolioRepo.save(portfolio);

    if (file && previousThumbnailUrl) {
      await this.storage.deleteByUrl(previousThumbnailUrl).catch(() => {});
    }

    return this.serialize(updated);
  }

  async remove(id: string, userId: string) {
    const portfolio = await this.candidatePortfolioRepo.findOne({
      where: { id },
      relations: { candidate: true },
    });

    if (!portfolio)
      throw new NotFoundException('Portfolio item record missing.');
    if (portfolio.candidate.userId !== userId)
      throw new ForbiddenException('Access to modify this object is denied.');

    await this.candidatePortfolioRepo.delete(id);
    if (portfolio.thumbnailUrl) {
      await this.storage.deleteByUrl(portfolio.thumbnailUrl).catch(() => {});
    }
    return { success: true, message: 'Portfolio item deleted successfully.' };
  }

  async findPublicByCandidateId(
    candidateId: string,
  ): Promise<PortfolioResponseDto[]> {
    const profile = await this.candidateProfileRepo.findOne({
      where: { id: candidateId },
    });

    if (!profile) {
      throw new NotFoundException('Candidate not found.');
    }

    const portfolios = await this.candidatePortfolioRepo.find({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });

    return this.serialize(portfolios);
  }
}
