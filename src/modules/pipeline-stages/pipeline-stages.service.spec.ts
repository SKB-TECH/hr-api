import { Test, TestingModule } from '@nestjs/testing';
import { PipelineStagesService } from './pipeline-stages.service';

describe('PipelineStagesService', () => {
  let service: PipelineStagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PipelineStagesService],
    }).compile();

    service = module.get<PipelineStagesService>(PipelineStagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
