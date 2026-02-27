import { StatusCodes } from 'http-status-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: FieldError[];

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    errors?: FieldError[],
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  public static badRequest(message: string, errors?: FieldError[]): AppError {
    return new AppError(message, StatusCodes.BAD_REQUEST, errors);
  }

  public static notFound(resource: string): AppError {
    return new AppError(`${resource} not found`, StatusCodes.NOT_FOUND);
  }

  public static conflict(message: string): AppError {
    return new AppError(message, StatusCodes.CONFLICT);
  }

  public static internal(message: string): AppError {
    return new AppError(message, StatusCodes.INTERNAL_SERVER_ERROR, undefined, false);
  }
}

export interface FieldError {
  field: string;
  message: string;
  code: string;
}
