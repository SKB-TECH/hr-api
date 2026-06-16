import { Test, TestingModule } from '@nestjs/testing';
import { PortfolioController } from './candidate-portfolio.controller';
import { PortfolioService } from './candidate-portfolio.service';

describe('PortfolioController', () => {
  let controller: PortfolioController;

  const mockPortfolioService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        {
          provide: PortfolioService,
          useValue: mockPortfolioService,
        },
      ],
    }).compile();

    controller = module.get<PortfolioController>(PortfolioController);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a portfolio', async () => {
      const dto = { title: 'Test', description: 'desc', projectUrl: 'url' };

      const file: any = { originalname: 'img.png' };

      const expected = { id: '1', ...dto };

      mockPortfolioService.create.mockResolvedValue(expected);

      const result = await controller.create(
        { user: { id: 'user-id' } } as any,
        dto as any,
        file,
      );

      expect(result.statusCode).toBe(201);
      expect(result.data).toEqual(expected);
      expect(mockPortfolioService.create).toHaveBeenCalledWith(
        'user-id',
        dto,
        file,
      );
    });
  });

  describe('findAll', () => {
    it('should return all portfolios', async () => {
      const expected = [{ id: '1' }];

      mockPortfolioService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll({
        user: { id: 'user-id' },
      } as any);

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(expected);
    });
  });

  describe('update', () => {
    it('should update portfolio', async () => {
      const dto = { title: 'Updated' };
      const file: any = { originalname: 'img.png' };

      const expected = { id: '1', title: 'Updated' };

      mockPortfolioService.update.mockResolvedValue(expected);

      const result = await controller.update(
        'portfolio-id',
        { user: { id: 'user-id' } } as any,
        dto as any,
        file,
      );

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(expected);
      expect(mockPortfolioService.update).toHaveBeenCalledWith(
        'portfolio-id',
        'user-id',
        dto,
        file,
      );
    });
  });

  describe('remove', () => {
    it('should delete portfolio', async () => {
      const expected = { success: true };

      mockPortfolioService.remove.mockResolvedValue(expected);

      const result = await controller.remove('portfolio-id', {
        user: { id: 'user-id' },
      } as any);

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(expected);
    });
  });
});
