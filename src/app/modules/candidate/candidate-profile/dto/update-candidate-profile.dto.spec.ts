import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserCandidateProfileDto } from './update-candidate-profile.dto';

describe('UpdateUserCandidateProfileDto', () => {
  it('accepts language proficiency JSON received through multipart form data', async () => {
    const dto = plainToInstance(UpdateUserCandidateProfileDto, {
      languageCodes: ['fr', 'af', 'ln', 'sw'],
      languageProficiencies: JSON.stringify([
        { code: 'fr', level: 'advanced' },
        { code: 'af', level: 'advanced' },
        { code: 'ln', level: 'advanced' },
        { code: 'sw', level: 'advanced' },
      ]),
    });

    await expect(
      validate(dto, { whitelist: true, forbidNonWhitelisted: true }),
    ).resolves.toEqual([]);
  });
});
