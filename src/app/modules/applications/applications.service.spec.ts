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
    );

    await expect(service.findByJob('job', {}, 'outsider')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
