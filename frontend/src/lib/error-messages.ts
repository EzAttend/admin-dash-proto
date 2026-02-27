const ERROR_CODE_MAP: Record<string, string> = {
  // CSV / Ingestion Errors
  DUPLICATE_IN_FILE: 'This value appears more than once in the same file.',
  RELATION_NOT_FOUND: 'A referenced record was not found — make sure it exists before importing.',
  INVALID_TYPE: 'The value has an unexpected format or type.',
  INVALID_ENUM: 'The value is not one of the allowed options.',
  REQUIRED_FIELD: 'This field is required and cannot be left empty.',
  INVALID_FORMAT: 'The value does not match the expected format.',
  CONFLICT_OVERLAP: 'This time slot conflicts with an existing entry.',
  CONFLICT_UNIQUE: 'A record with this value already exists.',
  DOUBLE_BOOKED_ROOM: 'This room is already booked at the specified time.',
  DOUBLE_BOOKED_TEACHER: 'This teacher is already assigned to another class at this time.',
  PRECONDITION_FAILED: 'Some required data has not been set up yet. Check the import order guide.',
  UNKNOWN_COLUMN: 'The file contains a column that is not recognized.',
  MISSING_COLUMN: 'A required column is missing from the file.',
  INVALID_CSV: 'The file could not be read as a valid CSV.',
  EMPTY_FILE: 'The uploaded file contains no data rows.',

  // Mongoose / Validation Errors
  VALIDATION_ERROR: 'Some fields have invalid values. Please review and try again.',
  CAST_ERROR: 'An ID or reference is in the wrong format.',
  DUPLICATE_KEY: 'A record with this value already exists.',
  NOT_FOUND: 'The requested record was not found.',
  REFERENCE_ERROR: 'A referenced record does not exist.',

  // Transaction / Server Errors
  TRANSACTION_ERROR: 'A server operation failed. Please try again.',
  INTERNAL_ERROR: 'Something went wrong on the server. Please try again later.',
};

export function humanizeErrorCode(code: string, fallbackMessage?: string): string {
  return ERROR_CODE_MAP[code] ?? fallbackMessage ?? 'An unexpected error occurred.';
}

export function humanizeRowError(error: {
  row: number;
  column: string;
  code: string;
  message: string;
}): string {
  const friendly = ERROR_CODE_MAP[error.code];
  if (friendly) {
    return `Row ${error.row}, column "${error.column}": ${friendly}`;
  }
  // Fallback: make the raw message more readable
  return `Row ${error.row}, column "${error.column}": ${error.message}`;
}

export function humanizeApiError(message: string): string {
  if (!message) return 'Something went wrong. Please try again.';

  if (message.includes('transaction') || message.includes('Transaction')) {
    return 'The database is temporarily unavailable. Please try again in a moment.';
  }

  if (message.includes('duplicate') || message.includes('E11000')) {
    const match = message.match(/index:\s+(\w+)/);
    const field = match?.[1] ?? 'value';
    return `A record with this ${field} already exists.`;
  }

  if (message.includes('Cast') || message.includes('ObjectId')) {
    return 'An invalid ID was provided. Please check your selection and try again.';
  }

  // Validation errors
  if (message.includes('validation failed')) {
    return 'Some fields have invalid values. Please check your input.';
  }

  if (message.includes('Network') || message.includes('fetch')) {
    return 'Unable to reach the server. Please check your connection.';
  }

  return message;
}

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  CLASS_IMPORT: 'Classes',
  SUBJECT_IMPORT: 'Subjects',
  ROOM_IMPORT: 'Rooms',
  STUDENT_IMPORT: 'Students',
  TEACHER_IMPORT: 'Teachers',
  TIMETABLE_IMPORT: 'Timetable',
};

export const JOB_STATUS_INFO: Record<string, { label: string; description: string }> = {
  PENDING: { label: 'Queued', description: 'Waiting to be processed' },
  RUNNING: { label: 'Processing', description: 'Import is in progress' },
  COMPLETED: { label: 'Completed', description: 'Import finished successfully' },
  FAILED: { label: 'Failed', description: 'Import encountered errors' },
};
