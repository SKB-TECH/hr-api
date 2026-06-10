// portfolio.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PortfolioService } from './candidate-portfolio.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary.service';

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockPrisma = {
    candidateProfile: {
      findUnique: jest.fn(),
    },
    candidatePortfolio: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCloudinary = {
    uploadImage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CloudinaryService,
          useValue: mockCloudinary,
        },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create portfolio successfully', async () => {
      const dto = {
        title: 'Portfolio 1',
        description: 'My project',
        projectUrl: 'https://example.com',
      };

      const file: any = {
        originalname: 'image.png',
      };

      mockPrisma.candidateProfile.findUnique.mockResolvedValue({
        id: 'profile-id',
      });

      mockCloudinary.uploadImage.mockResolvedValue({
        secure_url: 'https://cloudinary.com/image.png',
      });

      mockPrisma.candidatePortfolio.create.mockResolvedValue({
        id: 'portfolio-id',
        ...dto,
        thumbnailUrl: 'https://cloudinary.com/image.png',
      });

      const result = await service.create('user-id', dto as any, file);

      expect(result).toBeDefined();
      expect(mockCloudinary.uploadImage).toHaveBeenCalled();
      expect(mockPrisma.candidatePortfolio.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException when file is missing', async () => {
      await expect(
        service.create('user-id', {} as any, null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockPrisma.candidateProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-id', {} as any, {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all portfolios', async () => {
      mockPrisma.candidateProfile.findUnique.mockResolvedValue({
        candidatePortfolios: [
          {
            id: '1',
            title: 'Portfolio A',
          },
        ],
      });

      const result = await service.findAll('user-id');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });

    it('should throw NotFoundException if profile is missing', async () => {
      mockPrisma.candidateProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.findAll('user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update portfolio successfully', async () => {
      mockPrisma.candidatePortfolio.findUnique.mockResolvedValue({
        id: 'portfolio-id',
        thumbnailUrl: 'old-image.png',
        candidate: {
          userId: 'user-id',
        },
      });

      mockCloudinary.uploadImage.mockResolvedValue({
        secure_url: 'new-image.png',
      });

      mockPrisma.candidatePortfolio.update.mockResolvedValue({
        id: 'portfolio-id',
      });

      const result = await service.update(
        'portfolio-id',
        'user-id',
        {} as any,
        {} as any,
      );

      expect(result).toBeDefined();
      expect(mockPrisma.candidatePortfolio.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when portfolio is missing', async () => {
      mockPrisma.candidatePortfolio.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'portfolio-id',
          'user-id',
          {} as any,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrisma.candidatePortfolio.findUnique.mockResolvedValue({
        candidate: {
          userId: 'another-user',
        },
      });

      await expect(
        service.update(
          'portfolio-id',
          'user-id',
          {} as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete portfolio successfully', async () => {
      mockPrisma.candidatePortfolio.findUnique.mockResolvedValue({
        id: 'portfolio-id',
        candidate: {
          userId: 'user-id',
        },
      });

      mockPrisma.candidatePortfolio.delete.mockResolvedValue({});

      const result = await service.remove(
        'portfolio-id',
        'user-id',
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.candidatePortfolio.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if portfolio does not exist', async () => {
      mockPrisma.candidatePortfolio.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('portfolio-id', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own portfolio', async () => {
      mockPrisma.candidatePortfolio.findUnique.mockResolvedValue({
        candidate: {
          userId: 'another-user',
        },
      });

      await expect(
        service.remove('portfolio-id', 'user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});