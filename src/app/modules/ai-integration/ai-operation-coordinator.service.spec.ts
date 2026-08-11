import { ConflictException } from '@nestjs/common';
import { AiOperationCoordinator } from './ai-operation-coordinator.service';

describe('AiOperationCoordinator', () => {
  const key = '550e8400-e29b-41d4-a716-446655440000';

  it('executes a newly acquired operation once', async () => {
    const redis = { setNx: jest.fn().mockResolvedValue(true), del: jest.fn() };
    const service = new AiOperationCoordinator(redis as any);
    const callback = jest.fn().mockResolvedValue('done');
    await expect(
      service.run('workflow', 'user', 'job', key, callback),
    ).resolves.toBe('done');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('rejects duplicate operations', async () => {
    const service = new AiOperationCoordinator({
      setNx: jest.fn().mockResolvedValue(false),
    } as any);
    await expect(
      service.run('workflow', 'user', 'job', key, jest.fn()),
    ).rejects.toThrow(ConflictException);
  });

  it('releases the lock when the downstream operation fails', async () => {
    const redis = {
      setNx: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AiOperationCoordinator(redis as any);
    await expect(
      service.run('workflow', 'user', 'job', key, async () => {
        throw new Error('downstream');
      }),
    ).rejects.toThrow('downstream');
    expect(redis.del).toHaveBeenCalledTimes(1);
  });
});
