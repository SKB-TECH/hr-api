import { Test, TestingModule } from '@nestjs/testing';
import { PipelineStagesController } from './pipeline-stages.controller';
import { PipelineStagesService } from './pipeline-stages.service';

describe('PipelineStagesController', () => {
  let controller: PipelineStagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PipelineStagesController],
      providers: [PipelineStagesService],
    }).compile();

    controller = module.get<PipelineStagesController>(PipelineStagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
