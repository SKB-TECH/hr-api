import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from '../../libs/i18n/i18n.service';
import { ERROR_MAP } from './error-map';

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

      const exceptionMessage =
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
          ? (exceptionResponse as { message?: unknown }).message
          : undefined;
      const hasSpecificMessage =
        typeof exceptionMessage === 'string' &&
        !['Unauthorized', 'Forbidden'].includes(exceptionMessage);

      if (mapped?.forceTranslate && !hasSpecificMessage) {
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
