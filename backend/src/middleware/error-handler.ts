import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/utils/app-error';
import { IS_DEV } from '@/config';
import { StatusCodes } from 'http-status-codes';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    });
    return;
  }

  // Our custom operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.name === 'MongoServerError' && (err as unknown as Record<string, unknown>).code === 11000) {
    const keyValue = (err as unknown as Record<string, unknown>).keyValue as Record<string, unknown>;
    const field = Object.keys(keyValue || {})[0] || 'unknown';
    res.status(StatusCodes.CONFLICT).json({
      status: 'error',
      message: `Duplicate value for '${field}'`,
      errors: [{ field, message: `'${field}' already exists`, code: 'DUPLICATE' }],
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Database validation failed',
      errors: Object.entries((err as unknown as Record<string, unknown>).errors || {}).map(
        ([field, detail]) => ({
          field,
          message: (detail as Record<string, string>).message,
          code: 'MONGOOSE_VALIDATION',
        }),
      ),
    });
    return;
  }

  // Unknown / programmer errors
  console.error('[ERROR] Unhandled error:', err);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: 'Internal server error',
    ...(IS_DEV && { stack: err.stack }),
  });
}
