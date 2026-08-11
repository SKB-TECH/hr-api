import { AiGatewayController } from './ai-gateway.controller';
import { ConflictException } from '@nestjs/common';

describe('AiGatewayController', () => {
  it('authorizes company scope before invoking a recruiter workflow', async () => {
    const ai = { post: jest.fn().mockResolvedValue({ outputs: [] }) };
    const integration = {
      companyForRecruiter: jest.fn().mockResolvedValue('company-id'),
    };
    const operations = {
      run: jest.fn(
        (_operation, _userId, _entityId, _key, callback) => callback(),
      ),
    };
    const controller = new AiGatewayController(
      ai as any,
      integration as any,
      operations as any,
    );

    await controller.runWorkflow(
      'job-id',
      { request: 'Find candidates', limit: 5 },
      { id: 'recruiter-id' },
      'request-id',
      '550e8400-e29b-41d4-a716-446655440000',
    );

    expect(integration.companyForRecruiter).toHaveBeenCalledWith(
      'job-id',
      'recruiter-id',
    );
    expect(ai.post).toHaveBeenCalledWith(
      '/api/v1/internal/ai/recruiter/workflows/job',
      expect.objectContaining({ companyId: 'company-id', jobId: 'job-id' }),
      'request-id',
    );
  });

  it('sends only the recruiter request to AI before SQL candidate search', async () => {
    const criteria = {
      seniority: 'senior',
      requiredSkills: ['React'],
      domainExperience: ['SaaS'],
    };
    const ai = { post: jest.fn().mockResolvedValue(criteria) };
    const integration = {
      companyForRecruiter: jest.fn().mockResolvedValue('company-id'),
      searchCandidates: jest.fn().mockResolvedValue([{ id: 'candidate' }]),
    };
    const operations = {
      run: jest.fn(
        (_operation, _userId, _entityId, _key, callback) => callback(),
      ),
    };
    const controller = new AiGatewayController(
      ai as any,
      integration as any,
      operations as any,
    );

    const result = await controller.search(
      'job-id',
      { request: 'Senior React SaaS engineers', limit: 5 },
      { id: 'recruiter-id' },
      'request-id',
      '550e8400-e29b-41d4-a716-446655440000',
    );

    expect(ai.post).toHaveBeenCalledWith(
      '/api/v1/internal/ai/recruiter/search/interpret',
      { request: 'Senior React SaaS engineers' },
      'request-id',
    );
    expect(integration.searchCandidates).toHaveBeenCalledWith(
      'job-id',
      'company-id',
      { ...criteria, limit: 5 },
    );
    expect(result.requiresHumanReview).toBe(true);
  });

  it('blocks duplicate costly requests with the same idempotency key', async () => {
    const controller = new AiGatewayController(
      { post: jest.fn() } as any,
      { companyForRecruiter: jest.fn().mockResolvedValue('company') } as any,
      {
        run: jest.fn().mockRejectedValue(new ConflictException()),
      } as any,
    );
    await expect(
      controller.runWorkflow(
        'job',
        { request: 'Rank', limit: 5 },
        { id: 'user' },
        'request',
        '550e8400-e29b-41d4-a716-446655440000',
      ),
    ).rejects.toThrow(ConflictException);
  });
});
