import { Test } from '@nestjs/testing';
import { SkillManagementController } from './candidate-skill.controller';
import { SkillManagementService } from './candidate-skill.service';
import { ParseUUIDPipe } from '@nestjs/common';

const serviceMock = {
  createCategory: jest.fn(),
  deleteCategory: jest.fn(),
  findAllCategories: jest.fn(),
  createSkill: jest.fn(),
  findAllSkills: jest.fn(),
  assignSkillToCandidate: jest.fn(),
  getCandidateSkills: jest.fn(),
  removeSkillFromCandidate: jest.fn(),
  getSkillsByCandidateProfileId: jest.fn(),
};

describe('SkillManagementController', () => {
  let controller: SkillManagementController;
  let service: typeof serviceMock;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SkillManagementController],
      providers: [
        { provide: SkillManagementService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get(SkillManagementController);
    service = module.get(SkillManagementService);

    jest.clearAllMocks();
  });

  // =====================
  // CATEGORY
  // =====================

  it('should create category', async () => {
    service.createCategory.mockResolvedValue({
      id: '1',
      name: 'Backend',
    });

    const result = await controller.createCategory({ name: 'Backend' });

    expect(service.createCategory).toHaveBeenCalled();
    expect(result.name).toBe('Backend');
  });

  it('should delete category', async () => {
    service.deleteCategory.mockResolvedValue(undefined);

    await controller.deleteCategory('uuid-1');

    expect(service.deleteCategory).toHaveBeenCalledWith('uuid-1');
  });

  it('should return all categories', async () => {
    service.findAllCategories.mockResolvedValue([
      { id: '1', name: 'Backend' },
    ]);

    const result = await controller.getAllCategories();

    expect(result.length).toBe(1);
  });

  // =====================
  // SKILLS DIRECTORY
  // =====================

  it('should create skill', async () => {
    service.createSkill.mockResolvedValue({
      id: '1',
      name: 'NestJS',
    });

    const result = await controller.createSkill({
      name: 'NestJS',
      categoryId: 'cat1',
    });

    expect(result.name).toBe('NestJS');
  });

  it('should return all skills', async () => {
    service.findAllSkills.mockResolvedValue([
      { id: '1', name: 'NestJS' },
    ]);

    const result = await controller.getGlobalDirectoryList();

    expect(result.length).toBe(1);
  });

  // =====================
  // CANDIDATE SKILLS
  // =====================

  it('should assign skill to candidate', async () => {
    const req = { user: { id: 'user1' } };

    service.assignSkillToCandidate.mockResolvedValue({
      id: 'cs1',
      level: 'advanced',
    });

    const result = await controller.linkSkillSelf(req, {
      skillId: 'skill1',
      level: 'advanced',
      yearsExperience: 3,
    });

    expect(service.assignSkillToCandidate).toHaveBeenCalledWith(
      'user1',
      expect.any(Object),
    );

    expect(result.level).toBe('advanced');
  });

  it('should get candidate skills', async () => {
    const req = { user: { id: 'user1' } };

    service.getCandidateSkills.mockResolvedValue([
      { id: '1', level: 'beginner' },
    ]);

    const result = await controller.getMyActiveSkills(req);

    expect(result.length).toBe(1);
  });

  it('should remove candidate skill', async () => {
    const req = { user: { id: 'user1' } };

    service.removeSkillFromCandidate.mockResolvedValue(undefined);

    await controller.removeMySkillLink(req, 'skill-uuid');

    expect(service.removeSkillFromCandidate).toHaveBeenCalledWith(
      'user1',
      'skill-uuid',
    );
  });

  // =====================
  // ADMIN VIEW OF CANDIDATE SKILLS
  // =====================

  it('should inspect candidate profile skills', async () => {
    service.getSkillsByCandidateProfileId.mockResolvedValue([
      { id: '1', candidateId: 'cand1' },
    ]);

    const result = await controller.inspectProfileSkills('cand1');

    expect(result[0].candidateId).toBe('cand1');
  });
});