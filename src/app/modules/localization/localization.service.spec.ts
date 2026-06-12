import { Test, TestingModule } from '@nestjs/testing';
import { LocalizationService } from './localization.service';

describe('LocalizationService', () => {
  let service: LocalizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalizationService],
    }).compile();

    service = module.get<LocalizationService>(LocalizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
