import { parse } from 'csv-parse';
import { Readable } from 'stream';
import type { IngestionError, ParsedRow } from '../types';

export interface CsvParseResult {
  rows: ParsedRow[];
  errors: IngestionError[];
}

export async function parseCsv(
  input: Buffer | string,
  expected: readonly string[],
): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    const rows: ParsedRow[] = [];
    const errors: IngestionError[] = [];
    let headerValidated = false;
    let rowNumber = 0;

    const stream = Readable.from(typeof input === 'string' ? input : input.toString('utf-8'));

    const parser = stream.pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
      }),
    );

    parser.on('data', (record: Record<string, string>) => {
      if (!headerValidated) {
        const headerErrors = validateHeaders(Object.keys(record), expected);
        if (headerErrors.length > 0) {
          errors.push(...headerErrors);
          parser.destroy();
          resolve({ rows: [], errors });
          return;
        }
        headerValidated = true;
      }

      rowNumber++;
      rows.push({ rowNumber, data: record });
    });

    parser.on('error', (err: Error) => {
      errors.push({
        row: rowNumber + 1,
        column: '',
        code: 'PARSE_ERROR',
        message: `CSV parse error: ${err.message}`,
      });
    });

    parser.on('end', () => {
      resolve({ rows, errors });
    });
  });
}

function validateHeaders(
  actual: string[],
  expected: readonly string[],
): IngestionError[] {
  const errors: IngestionError[] = [];
  const actualSet = new Set(actual.map((h) => h.trim().toLowerCase()));
  const expectedSet = new Set(expected.map((h) => h.toLowerCase()));

  for (const header of expected) {
    if (!actualSet.has(header.toLowerCase())) {
      errors.push({
        row: 0,
        column: header,
        code: 'MISSING_HEADER',
        message: `Missing required CSV header: '${header}'`,
      });
    }
  }

  for (const header of actual) {
    if (!expectedSet.has(header.trim().toLowerCase())) {
      errors.push({
        row: 0,
        column: header.trim(),
        code: 'EXTRA_HEADER',
        message: `Unexpected CSV header: '${header.trim()}'`,
      });
    }
  }

  return errors;
}
