import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PortfolioService } from './candidate-portfolio.service';
import { StorageService } from '@/libs/storage/storage.service';
import { CandidatePortfolio } from './entities/candidate-portfolio.entity';
import { CandidateProfile } from '../candidate-profile/entities/candidate-profile.entity';

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockPortfolioRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    delete: jest.fn(),
  };

  const mockProfileRepo = {
    findOne: jest.fn(),
  };

  const mockStorage = {
    uploadImage: jest.fn(),
    deleteByUrl: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: getRepositoryToken(CandidatePortfolio),
          useValue: mockPortfolioRepo,
        },
        {
          provide: getRepositoryToken(CandidateProfile),
          useValue: mockProfileRepo,
        },
        {
          provide: StorageService,
          useValue: mockStorage,
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

      mockProfileRepo.findOne.mockResolvedValue({ id: 'profile-id' });

      mockStorage.uploadImage.mockResolvedValue({
        url: 'https://storage.googleapis.com/bucket/image.png',
      });

      const created = {
        id: 'portfolio-id',
        ...dto,
        thumbnailUrl: 'https://storage.googleapis.com/bucket/image.png',
      };
      mockPortfolioRepo.create.mockReturnValue(created);
      mockPortfolioRepo.save.mockResolvedValue(created);

      const result = await service.create('user-id', dto as any, file);

      expect(result).toBeDefined();
      expect(mockStorage.uploadImage).toHaveBeenCalled();
      expect(mockPortfolioRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException when file is missing', async () => {
      await expect(
        service.create('user-id', {} as any, null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockProfileRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('user-id', {} as any, {} as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all portfolios', async () => {
      mockProfileRepo.findOne.mockResolvedValue({ id: 'profile-id' });
      mockPortfolioRepo.find.mockResolvedValue([
        { id: '1', title: 'Portfolio A' },
      ]);

      const result = await service.findAll('user-id');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });

    it('should throw NotFoundException if profile is missing', async () => {
      mockProfileRepo.findOne.mockResolvedValue(null);

      await expect(service.findAll('user-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update portfolio successfully', async () => {
      mockPortfolioRepo.findOne.mockResolvedValue({
        id: 'portfolio-id',
        thumbnailUrl: 'old-image.png',
        candidate: {
          userId: 'user-id',
        },
      });

      mockStorage.uploadImage.mockResolvedValue({
        url: 'new-image.png',
      });

      mockPortfolioRepo.merge.mockImplementation((entity, patch) =>
        Object.assign(entity, patch),
      );
      mockPortfolioRepo.save.mockResolvedValue({ id: 'portfolio-id' });

      const result = await service.update(
        'portfolio-id',
        'user-id',
        {} as any,
        {} as any,
      );

      expect(result).toBeDefined();
      expect(mockPortfolioRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when portfolio is missing', async () => {
      mockPortfolioRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('portfolio-id', 'user-id', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPortfolioRepo.findOne.mockResolvedValue({
        candidate: {
          userId: 'another-user',
        },
      });

      await expect(
        service.update('portfolio-id', 'user-id', {} as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete portfolio successfully', async () => {
      mockPortfolioRepo.findOne.mockResolvedValue({
        id: 'portfolio-id',
        candidate: {
          userId: 'user-id',
        },
      });

      mockPortfolioRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('portfolio-id', 'user-id');

      expect(result.success).toBe(true);
      expect(mockPortfolioRepo.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if portfolio does not exist', async () => {
      mockPortfolioRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('portfolio-id', 'user-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own portfolio', async () => {
      mockPortfolioRepo.findOne.mockResolvedValue({
        candidate: {
          userId: 'another-user',
        },
      });

      await expect(service.remove('portfolio-id', 'user-id')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
