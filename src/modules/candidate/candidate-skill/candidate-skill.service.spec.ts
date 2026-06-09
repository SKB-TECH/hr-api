import { Test } from '@nestjs/testing';
import { SkillManagementService } from './candidate-skill.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const prismaMock = {
  skillCategory: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  skill: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  candidateProfile: {
    findUnique: jest.fn(),
  },
  candidateSkill: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

describe('SkillManagementService', () => {
  let service: SkillManagementService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SkillManagementService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(SkillManagementService);

    jest.clearAllMocks();
  });

  // =====================
  // CATEGORY TESTS
  // =====================

  it('should create a category', async () => {
    prismaMock.skillCategory.findFirst.mockResolvedValue(null);
    prismaMock.skillCategory.create.mockResolvedValue({
      id: '1',
      name: 'Backend',
    });

    const result = await service.createCategory({ name: 'Backend' });

    expect(result.name).toBe('Backend');
  });

  it('should throw conflict if category exists', async () => {
    prismaMock.skillCategory.findFirst.mockResolvedValue({ id: '1' });

    await expect(
      service.createCategory({ name: 'Backend' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should delete category', async () => {
    prismaMock.skillCategory.findUnique.mockResolvedValue({ id: '1' });
    prismaMock.skillCategory.delete.mockResolvedValue({});

    await expect(service.deleteCategory('1')).resolves.toBeUndefined();
  });

  it('should throw not found when deleting category', async () => {
    prismaMock.skillCategory.findUnique.mockResolvedValue(null);

    await expect(service.deleteCategory('1')).rejects.toThrow(
      NotFoundException,
    );
  });

  // =====================
  // SKILL TESTS
  // =====================

  it('should create skill', async () => {
    prismaMock.skillCategory.findUnique.mockResolvedValue({ id: 'cat1' });
    prismaMock.skill.findFirst.mockResolvedValue(null);

    prismaMock.skill.create.mockResolvedValue({
      id: 's1',
      name: 'NestJS',
      slug: 'nestjs',
      category: { id: 'cat1', name: 'Backend' },
    });

    const result = await service.createSkill({
      name: 'NestJS',
      categoryId: 'cat1',
    });

    expect(result.name).toBe('NestJS');
  });

  it('should throw error if category not found when creating skill', async () => {
    prismaMock.skillCategory.findUnique.mockResolvedValue(null);

    await expect(
      service.createSkill({ name: 'NestJS', categoryId: 'bad' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should return all skills', async () => {
    prismaMock.skill.findMany.mockResolvedValue([
      {
        id: '1',
        name: 'NestJS',
        slug: 'nestjs',
        category: { id: 'c1', name: 'Backend' },
      },
    ]);

    const result = await service.findAllSkills();

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('NestJS');
  });

  // =====================
  // CANDIDATE SKILLS
  // =====================

  it('should assign skill to candidate', async () => {
    prismaMock.candidateProfile.findUnique.mockResolvedValue({
      id: 'cand1',
    });

    prismaMock.skill.findUnique.mockResolvedValue({
      id: 'skill1',
    });

    prismaMock.candidateSkill.upsert.mockResolvedValue({
      id: 'cs1',
      candidateId: 'cand1',
      level: 'advanced',
      yearsExperience: 3,
      skill: {
        id: 'skill1',
        name: 'NestJS',
        slug: 'nestjs',
        category: { id: 'c1', name: 'Backend' },
      },
    });

    const result = await service.assignSkillToCandidate('user1', {
      skillId: 'skill1',
      level: 'advanced',
      yearsExperience: 3,
    });

    expect(result.level).toBe('advanced');
  });

  it('should return empty array if candidate profile not found', async () => {
    prismaMock.candidateProfile.findUnique.mockResolvedValue(null);

    const result = await service.getCandidateSkills('user1');

    expect(result).toEqual([]);
  });

  it('should get candidate skills', async () => {
    prismaMock.candidateProfile.findUnique.mockResolvedValue({
      id: 'cand1',
    });

    prismaMock.candidateSkill.findMany.mockResolvedValue([
      {
        id: 'cs1',
        candidateId: 'cand1',
        level: 'beginner',
        yearsExperience: 1,
        skill: {
          id: 's1',
          name: 'NestJS',
          slug: 'nestjs',
          category: { id: 'c1', name: 'Backend' },
        },
      },
    ]);

    const result = await service.getCandidateSkills('user1');

    expect(result.length).toBe(1);
  });

  it('should remove skill from candidate', async () => {
    prismaMock.candidateProfile.findUnique.mockResolvedValue({
      id: 'cand1',
    });

    prismaMock.candidateSkill.findFirst.mockResolvedValue({
      id: 'cs1',
    });

    prismaMock.candidateSkill.delete.mockResolvedValue({});

    await expect(
      service.removeSkillFromCandidate('user1', 'cs1'),
    ).resolves.toBeUndefined();
  });

  it('should throw error if skill not found for removal', async () => {
    prismaMock.candidateProfile.findUnique.mockResolvedValue({
      id: 'cand1',
    });

    prismaMock.candidateSkill.findFirst.mockResolvedValue(null);

    await expect(
      service.removeSkillFromCandidate('user1', 'cs1'),
    ).rejects.toThrow(NotFoundException);
  });

  // =====================
  // GET BY CANDIDATE ID
  // =====================

  it('should get skills by candidate id', async () => {
    prismaMock.candidateSkill.findMany.mockResolvedValue([
      {
        id: '1',
        candidateId: 'cand1',
        level: 'advanced',
        yearsExperience: 5,
        skill: {
          id: 's1',
          name: 'NestJS',
          slug: 'nestjs',
          category: { id: 'c1', name: 'Backend' },
        },
      },
    ]);

    const result = await service.getSkillsByCandidateProfileId('cand1');

    expect(result[0].candidateId).toBe('cand1');
  });
});