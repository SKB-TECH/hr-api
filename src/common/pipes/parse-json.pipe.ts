import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserCandidateProfileDto } from '../../modules/candidate-profile/dto/update-candidate-profile.dto';

@Injectable()
export class ParseProfileJsonPipe implements PipeTransform {
  async transform(value: any) {
    if (!value) {
      throw new BadRequestException(
        'The profile payload "data" field cannot be empty.',
      );
    }

    try {
      const parsedObj = typeof value === 'string' ? JSON.parse(value) : value;
      const objectInstance = plainToInstance(
        UpdateUserCandidateProfileDto,
        parsedObj,
      );

      const errors = await validate(objectInstance, {
        whitelist: true,
        validationError: { target: false }, // Hides the raw values from error payloads for safety
      });

      if (errors.length > 0) {
        const errorMessages = errors
          .map((err) => Object.values(err.constraints || {}))
          .flat();
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Validation failed for candidate profile fields',
          errors: errorMessages,
        });
      }

      return objectInstance;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        'The profile metadata property must be a valid, stringified JSON object layout structure.',
      );
    }
  }
}
