import { ForbiddenException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';

describe('ApplicationsService authorization', () => {
  it('rejects a recruiter outside the job company', async () => {
    const service = new ApplicationsService(
      {} as any,
      {} as any,
      {
        findOne: jest.fn().mockResolvedValue({
          id: 'job',
          companyId: 'company',
        }),
      } as any,
      {} as any,
      { findOne: jest.fn().mockResolvedValue(null) } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(service.findByJob('job', {}, 'outsider')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('returns the saved application when the confirmation email fails', async () => {
    const saved = { id: 'application-1' };
    const job = {
      id: 'job-1',
      status: 'LIVE',
      company: { status: 'active', pipelineStages: [] },
      companyId: 'company-1',
      applicationsCount: 0,
      capacity: 10,
      applyBefore: null,
    };
    const jobRepo = {
      findOne: jest.fn().mockResolvedValue(job),
      increment: jest.fn(),
    };
    const applicationRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockReturnValue(saved),
      save: jest.fn().mockResolvedValue(saved),
    };
    const companyRepo = {
      findOne: jest
        .fn()
        .mockResolvedValue({ id: 'company-1', status: 'active' }),
    };
    const pipelineStageRepo = { find: jest.fn().mockResolvedValue([]) };
    const candidateProfileRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 'profile-1' }),
    };
    const resumeRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const dataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: jest.fn((entity) => {
            if (entity.name === 'Job') return jobRepo;
            if (entity.name === 'Company') return companyRepo;
            if (entity.name === 'PipelineStage') return pipelineStageRepo;
            if (entity.name === 'CandidateProfile') return candidateProfileRepo;
            if (entity.name === 'Resume') return resumeRepo;
            return applicationRepo;
          }),
        }),
      ),
    };
    const mail = {
      sendApplicationReviewingEmail: jest
        .fn()
        .mockRejectedValue(new Error('mail unavailable')),
    };
    const service = new ApplicationsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      dataSource as any,
      mail as any,
      {} as any,
    );

    await expect(
      service.create(
        {
          jobId: 'job-1',
          fullName: 'Benjamin',
          email: 'benjamin@example.com',
        },
        'candidate-1',
      ),
    ).resolves.toEqual(saved);
  });
});
