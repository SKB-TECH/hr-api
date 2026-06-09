import { Test, TestingModule } from '@nestjs/testing';
import { CandidateSkillService } from './candidate-skill.service';

describe('CandidateSkillService', () => {
  let service: CandidateSkillService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CandidateSkillService],
    }).compile();

    service = module.get<CandidateSkillService>(CandidateSkillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
