import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiClientService } from './ai-client.service';

describe('AiClientService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('calls hr-ia server-to-server with the service token and request id', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ requiresHumanReview: true }),
    } as Response);
    const values: Record<string, string> = {
      HR_AI_BASE_URL: 'http://hr-ia:3001',
      HR_AI_SERVICE_TOKEN_CURRENT: 's'.repeat(32),
      HR_AI_REQUEST_TIMEOUT_MS: '1000',
    };
    const service = new AiClientService({
      get: (key: string) => values[key],
    } as any);

    await expect(
      service.post('/workflow', { request: 'rank' }, 'request-id'),
    ).resolves.toEqual({ requiresHumanReview: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://hr-ia:3001/workflow',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-service-token': 's'.repeat(32),
          'x-request-id': 'request-id',
        }),
      }),
    );
  });

  it('fails closed when integration credentials are missing', async () => {
    const service = new AiClientService({ get: () => undefined } as any);
    await expect(service.post('/workflow', {}, 'request-id')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('does not expose an internal AI error body', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false, status: 400 } as Response);
    const service = new AiClientService({
      get: (key: string) =>
        key === 'HR_AI_BASE_URL'
          ? 'http://hr-ia:3001'
          : key === 'HR_AI_SERVICE_TOKEN'
            ? 's'.repeat(32)
            : undefined,
    } as any);
    await expect(service.post('/workflow', {}, 'request-id')).rejects.toThrow(
      BadGatewayException,
    );
  });
});
