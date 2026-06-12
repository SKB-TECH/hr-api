import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from '../../libs/i18n/i18n.service';

const ERROR_MAP: Record<number, { error: string; key: string }> = {
  [HttpStatus.UNAUTHORIZED]: {
    error: 'UNAUTHORIZED',
    key: 'auth.authentication_required',
  },
  [HttpStatus.FORBIDDEN]: {
    error: 'FORBIDDEN',
    key: 'auth.permission_denied',
  },
  [HttpStatus.NOT_FOUND]: { error: 'NOT_FOUND', key: 'common.not_found' },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    error: 'TOO_MANY_REQUESTS',
    key: 'common.too_many_requests',
  },
};

const FORCE_TRANSLATE_STATUSES = new Set<number>([
  HttpStatus.UNAUTHORIZED,
  HttpStatus.FORBIDDEN,
]);

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const mapped = ERROR_MAP[status];

      if (FORCE_TRANSLATE_STATUSES.has(status) && mapped) {
        response.status(status).json({
          statusCode: status,
          message: this.i18n.t(mapped.key),
          error: mapped.error,
        });
        return;
      }

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'error' in exceptionResponse &&
        'message' in exceptionResponse
      ) {
        response.status(status).json(exceptionResponse);
        return;
      }

      const raw =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any)?.message || exception.message;

      const message = Array.isArray(raw) ? raw[0] : raw;

      response.status(status).json({
        statusCode: status,
        message: message || (mapped ? this.i18n.t(mapped.key) : 'Error'),
        error: mapped?.error || 'ERROR',
      });
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
}
