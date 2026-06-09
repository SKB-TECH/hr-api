import { Test, TestingModule } from '@nestjs/testing';
import { CandidateResumeController } from './candidate-resume.controller';
import { CandidateResumeService } from './candidate-resume.service';

describe('CandidateResumeController', () => {
  let controller: CandidateResumeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidateResumeController],
      providers: [
        {
          provide: CandidateResumeService,
          useValue: {
            uploadResume: jest.fn(),
            getAll: jest.fn(),
            getDefault: jest.fn(),
            setDefault: jest.fn(),
            deleteResume: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CandidateResumeController>(CandidateResumeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});