import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { StatusCodes } from 'http-status-codes';

interface ValidationTarget {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export function validate(schemas: ValidationTarget) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        );
      } else {
        req.body = result.data;
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((e) => ({
            field: `params.${e.path.join('.')}`,
            message: e.message,
            code: e.code,
          })),
        );
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map((e) => ({
            field: `query.${e.path.join('.')}`,
            message: e.message,
            code: e.code,
          })),
        );
      }
    }

    if (errors.length > 0) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
      return;
    }

    next();
  };
}
