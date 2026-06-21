import { HttpException } from '@nestjs/common';
import type { ApiErrorCode } from '@workarmy/types';

/** A typed HTTP exception whose body matches the SDK's ApiError contract. */
export class ApiException extends HttpException {
  constructor(
    status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: Record<string, string[]>,
  ) {
    super({ code, message, details }, status);
  }

  static badRequest(code: ApiErrorCode, message: string, details?: Record<string, string[]>) {
    return new ApiException(400, code, message, details);
  }

  static unauthorized(message = 'Unauthorized', code: ApiErrorCode = 'UNAUTHORIZED') {
    return new ApiException(401, code, message);
  }

  static conflict(code: ApiErrorCode, message: string) {
    return new ApiException(409, code, message);
  }

  static notFound(message = 'Not found') {
    return new ApiException(404, 'NOT_FOUND', message);
  }

  static tooMany(message = 'Too many requests', code: ApiErrorCode = 'RATE_LIMITED') {
    return new ApiException(429, code, message);
  }
}
