import { ZodSchema, ZodError } from 'zod';
import type { IngestionError, RowValidationResult } from '../types';

export function validateRow<T>(
  schema: ZodSchema<T>,
  raw: Record<string, string>,
  rowNumber: number,
  coerce?: (raw: Record<string, string>) => Record<string, unknown>,
): RowValidationResult<T> {
  const coerced = coerce ? coerce(raw) : raw;

  const result = schema.safeParse(coerced);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: zodErrorsToIngestionErrors(result.error, rowNumber),
  };
}

function zodErrorsToIngestionErrors(error: ZodError, rowNumber: number): IngestionError[] {
  return error.errors.map((e) => {
    const column = e.path.join('.');
    const code = mapZodCodeToIngestionCode(e.code, e.message);

    return {
      row: rowNumber,
      column,
      code,
      message: e.message,
    };
  });
}

function mapZodCodeToIngestionCode(
  zodCode: string,
  message: string,
): IngestionError['code'] {
  switch (zodCode) {
    case 'invalid_type':
      if (message.toLowerCase().includes('required')) return 'REQUIRED_FIELD';
      return 'INVALID_TYPE';
    case 'invalid_enum_value':
      return 'INVALID_ENUM';
    case 'invalid_string':
    case 'too_small':
    case 'too_big':
      return 'INVALID_FORMAT';
    case 'custom':
      return 'INVALID_FORMAT';
    default:
      return 'INVALID_TYPE';
  }
}
