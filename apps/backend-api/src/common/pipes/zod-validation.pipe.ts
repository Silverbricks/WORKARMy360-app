import { Injectable, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';
import { ApiException } from '../errors/api-exception';

/** Validates and parses a request payload against a shared zod schema. */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        (details[key] ??= []).push(issue.message);
      }
      throw ApiException.badRequest('VALIDATION_ERROR', 'Please check the highlighted fields.', details);
    }
    return result.data;
  }
}
