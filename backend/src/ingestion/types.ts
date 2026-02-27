
export interface IngestionError {
  row: number;
  column: string;
  code: IngestionErrorCode;
  message: string;
}

export type IngestionErrorCode =
  // Parsing
  | 'MISSING_HEADER'
  | 'EXTRA_HEADER'
  | 'PARSE_ERROR'
  // Validation
  | 'REQUIRED_FIELD'
  | 'INVALID_TYPE'
  | 'INVALID_ENUM'
  | 'INVALID_FORMAT'
  // Relations
  | 'RELATION_NOT_FOUND'
  // Cross-row consistency
  | 'DUPLICATE_IN_FILE'
  | 'DUPLICATE_IN_DB'
  | 'CONFLICT_OVERLAP'
  // Persistence
  | 'INSERT_FAILED'
  // Preconditions
  | 'PRECONDITION_FAILED';


export interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface ValidationResult<T = Record<string, unknown>> {
  valid: T[];
  errors: IngestionError[];
}

export interface IngestionResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: IngestionError[];
}

export interface EntityConfig<T = Record<string, unknown>> {
  expectedHeaders: readonly string[];
  validateRow: (row: Record<string, string>, rowNumber: number) => RowValidationResult<T>;
  relations: Record<string, RelationConfig>;
  uniqueFields: readonly string[];
  persist: (docs: T[]) => Promise<IngestionError[]>;
  preconditions?: readonly string[];
  uniqueFieldModels?: Record<string, string>;
}

export interface RelationConfig {
  modelName: string;
  lookupField: string;
}

export interface RowValidationResult<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  errors?: IngestionError[];
}

export type RelationMap = Map<string, string>;

export type ResolvedRelations = Record<string, RelationMap>;
