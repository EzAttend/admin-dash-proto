// Pipeline
export { ingestCsv } from './pipeline';

// Types
export type {
  IngestionError,
  IngestionErrorCode,
  IngestionResult,
  ParsedRow,
  ValidationResult,
  EntityConfig,
  RelationConfig,
  RowValidationResult,
  RelationMap,
  ResolvedRelations,
} from './types';

// Parsers
export { parseCsv } from './parsers';
export type { CsvParseResult } from './parsers';

// Validators
export { validateRow } from './validators/row-validator';
export {
  checkInFileDuplicates,
  checkDbDuplicates,
  checkTimetableOverlaps,
} from './validators/consistency-checker';

// Resolvers
export { buildRelationMaps, resolveRelations, validateRefs } from './resolvers';
export type { RefCheck } from './resolvers';

// Entity Configs
export {
  studentEntityConfig,
  teacherEntityConfig,
  timetableEntityConfig,
} from './entity-configs';
