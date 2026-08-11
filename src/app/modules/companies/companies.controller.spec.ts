import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

const mockPaginatedResult = {
  data: [
    {
      id: 'uuid-company-1',
      name: 'Nomad',
      slug: 'nomad',
      description: 'Nomad is located in Paris, France.',
      industry: 'Business Service',
      location: 'Paris, France',
      companySize: 'startup',
      logo: null,
      website: 'https://nomad.com',
      createdAt: new Date(),
    },
  ],
  meta: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
};

const mockCompaniesService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

describe('CompaniesController', () => {
  let controller: CompaniesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        { provide: CompaniesService, useValue: mockCompaniesService },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated companies', async () => {
      mockCompaniesService.findAll.mockResolvedValue(mockPaginatedResult);

      const result: any = await controller.findAll({});

      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(mockPaginatedResult.data);
      expect(result.meta).toEqual(mockPaginatedResult.meta);
      expect(mockCompaniesService.findAll).toHaveBeenCalledWith({});
    });

    it('should forward all query filters to the service', async () => {
      mockCompaniesService.findAll.mockResolvedValue(mockPaginatedResult);

      const query = {
        search: 'Nomad',
        location: 'Paris',
        industry: 'Design',
        page: 1,
        limit: 12,
      };
      await controller.findAll(query);

      expect(mockCompaniesService.findAll).toHaveBeenCalledWith(query);
    });

    it('should return empty data when no companies match', async () => {
      mockCompaniesService.findAll.mockResolvedValue({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });

      const result: any = await controller.findAll({ search: 'nonexistent' });

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a single company', async () => {
      mockCompaniesService.findOne.mockResolvedValue(
        mockPaginatedResult.data[0],
      );

      const result = await controller.findOne('uuid-company-1');

      expect(result.statusCode).toBe(200);
      expect(result.data.id).toBe('uuid-company-1');
      expect(mockCompaniesService.findOne).toHaveBeenCalledWith(
        'uuid-company-1',
      );
    });
  });

  describe('update', () => {
    it('should call service update and return updated company', async () => {
      mockCompaniesService.update.mockResolvedValue({
        ...mockPaginatedResult.data[0],
        name: 'Nomad Updated',
      });

      const result = await controller.update(
        'uuid-company-1',
        { name: 'Nomad Updated' },
        { id: 'owner-1' },
      );

      expect(result.statusCode).toBe(200);
      expect(result.data.name).toBe('Nomad Updated');
      expect(mockCompaniesService.update).toHaveBeenCalledWith(
        'uuid-company-1',
        'owner-1',
        { name: 'Nomad Updated' },
      );
    });
  });
});
