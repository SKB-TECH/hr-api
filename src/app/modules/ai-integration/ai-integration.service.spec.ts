import { ForbiddenException } from '@nestjs/common';
import { AiIntegrationService } from './ai-integration.service';
import { ResumeParsingStatus } from '@/utils/enums';

describe('AiIntegrationService', () => {
  const job = {
    id: 'job-id',
    companyId: 'company-a',
    title: 'Engineer',
    skills: [],
  } as any;

  it('never returns a job outside the supplied company scope', async () => {
    const service = new AiIntegrationService(
      { findOne: jest.fn().mockResolvedValue(job) } as any,
      {} as any,
      {} as any,
      { log: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(service.jobContext('job-id', 'company-b')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('performs candidate filtering in SQL and returns no database dump', async () => {
    const qb: any = {};
    for (const method of [
      'select',
      'innerJoin',
      'leftJoin',
      'where',
      'andWhere',
      'groupBy',
      'having',
      'limit',
    ])
      qb[method] = jest.fn().mockReturnValue(qb);
    qb.getRawMany = jest.fn().mockResolvedValue([]);
    const candidates = { createQueryBuilder: jest.fn(() => qb) } as any;
    const service = new AiIntegrationService(
      { findOne: jest.fn().mockResolvedValue(job) } as any,
      {} as any,
      candidates,
      { log: jest.fn().mockResolvedValue(undefined) } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.searchCandidates('job-id', 'company-a', {
        requiredSkills: ['React', 'TypeScript'],
        domainExperience: ['SaaS'],
        limit: 10,
      }),
    ).resolves.toEqual([]);
    expect(qb.having).toHaveBeenCalledWith(
      expect.stringContaining('COUNT(DISTINCT'),
      { requiredSkillCount: 2 },
    );
    expect(qb.limit).toHaveBeenCalledWith(10);
  });

  it('marks resume parsing complete without storing document content', async () => {
    const resumes = {
      findOne: jest.fn().mockResolvedValue({
        id: 'resume',
        parsedAt: null,
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const service = new AiIntegrationService(
      {} as any,
      {} as any,
      {} as any,
      audit as any,
      resumes as any,
      {} as any,
      {} as any,
    );

    await service.updateResumeParsingStatus(
      'resume',
      ResumeParsingStatus.COMPLETED,
    );

    expect(resumes.update).toHaveBeenCalledWith(
      'resume',
      expect.objectContaining({
        parsed: true,
        parsingStatus: ResumeParsingStatus.COMPLETED,
        parsingError: null,
        parsedAt: expect.any(Date),
      }),
    );
  });

  it('authorizes recruiter workflows only for a job company member', async () => {
    const service = new AiIntegrationService(
      {
        findOne: jest.fn().mockResolvedValue({
          id: 'job',
          companyId: 'company',
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { findOne: jest.fn().mockResolvedValue({ id: 'membership' }) } as any,
    );
    await expect(service.companyForRecruiter('job', 'user')).resolves.toBe(
      'company',
    );
  });
});
