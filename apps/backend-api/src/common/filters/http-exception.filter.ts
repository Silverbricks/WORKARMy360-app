import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiError, ApiErrorCode } from '@workarmy/types';

function mapStatusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'EMAIL_TAKEN';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL';
  }
}

/** Normalises every error into the ApiError shape the SDK expects. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Http');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiError = { code: 'INTERNAL', message: 'Something went wrong. Please try again.' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (payload && typeof payload === 'object' && 'code' in payload) {
        const p = payload as { code: ApiErrorCode; message: string; details?: Record<string, string[]> };
        body = { code: p.code, message: p.message, details: p.details };
      } else if (payload && typeof payload === 'object' && 'message' in payload) {
        const m = (payload as { message: unknown }).message;
        body = {
          code: mapStatusToCode(status),
          message: Array.isArray(m) ? m.join(', ') : String(m),
        };
      } else {
        body = { code: mapStatusToCode(status), message: String(payload) };
      }
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    res.status(status).json(body);
  }
}
