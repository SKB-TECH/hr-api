import { Test, TestingModule } from '@nestjs/testing';
import { CandidateSkillController } from './candidate-skill.controller';
import { CandidateSkillService } from './candidate-skill.service';

describe('CandidateSkillController', () => {
  let controller: CandidateSkillController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateSkillController],
      providers: [CandidateSkillService],
    }).compile();

    controller = module.get<CandidateSkillController>(CandidateSkillController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
