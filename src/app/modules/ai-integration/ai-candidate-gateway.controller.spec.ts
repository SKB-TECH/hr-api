import { AiCandidateGatewayController } from './ai-candidate-gateway.controller';
import { ResumeParsingStatus } from '@/utils/enums';

describe('AiCandidateGatewayController', () => {
  const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000';
  const operations = {
    run: jest.fn((_operation, _user, _entity, _key, callback) => callback()),
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns a proposal without applying it to the candidate profile', async () => {
    const file = {
      buffer: Buffer.from('resume'),
      mimeType: 'application/pdf',
      originalName: 'resume.pdf',
    };
    const ai = {
      postFile: jest.fn().mockResolvedValue({ data: { headline: 'Engineer' } }),
    };
    const integration = {
      resumeContentForCandidate: jest.fn().mockResolvedValue(file),
      updateResumeParsingStatus: jest.fn().mockResolvedValue(undefined),
      saveProfileSuggestion: jest.fn().mockResolvedValue({ id: 'suggestion' }),
    };
    const controller = new AiCandidateGatewayController(
      ai as any,
      integration as any,
      operations as any,
    );

    const result = await controller.extract(
      'resume-id',
      { id: 'candidate-id' },
      'request-id',
      idempotencyKey,
    );

    expect(integration.resumeContentForCandidate).toHaveBeenCalledWith(
      'resume-id',
      'candidate-id',
    );
    expect(result).toMatchObject({
      suggestionId: 'suggestion',
      requiresHumanReview: true,
      appliedToProfile: false,
    });
    expect(integration.saveProfileSuggestion).toHaveBeenCalledWith(
      'resume-id',
      'candidate-id',
      { data: { headline: 'Engineer' } },
    );
    expect(integration.updateResumeParsingStatus).toHaveBeenLastCalledWith(
      'resume-id',
      ResumeParsingStatus.COMPLETED,
    );
  });

  it('records a sanitized failed status when extraction fails', async () => {
    const integration = {
      resumeContentForCandidate: jest.fn().mockResolvedValue({}),
      updateResumeParsingStatus: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new AiCandidateGatewayController(
      {
        postFile: jest
          .fn()
          .mockRejectedValue(new Error('secret provider error')),
      } as any,
      integration as any,
      operations as any,
    );

    await expect(
      controller.extract(
        'resume-id',
        { id: 'candidate-id' },
        'request-id',
        idempotencyKey,
      ),
    ).rejects.toThrow('secret provider error');
    expect(integration.updateResumeParsingStatus).toHaveBeenLastCalledWith(
      'resume-id',
      ResumeParsingStatus.FAILED,
      'AI extraction failed',
    );
  });
});
