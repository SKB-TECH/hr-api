import { Test, TestingModule } from '@nestjs/testing';
import { LocalizationController } from './localization.controller';
import { LocalizationService } from './localization.service';

describe('LocalizationController', () => {
  let controller: LocalizationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocalizationController],
      providers: [LocalizationService],
    }).compile();

    controller = module.get<LocalizationController>(LocalizationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
