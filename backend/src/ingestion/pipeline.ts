import mongoose from 'mongoose';
import { parseCsv } from './parsers';
import {
    checkInFileDuplicates,
    checkDbDuplicates,
    checkTimetableOverlaps,
} from './validators/consistency-checker';
import { buildRelationMaps, resolveRelations } from './resolvers';
import type {
    EntityConfig,
    IngestionError,
    IngestionResult,
    ParsedRow,
} from './types';

const BATCH_SIZE = 500;

export async function ingestCsv<T extends Record<string, unknown>>(
    csv: Buffer | string,
    config: EntityConfig<T>,
    onProgress?: (processedRows: number) => void,
): Promise<IngestionResult> {
    const allErrors: IngestionError[] = [];

    if (config.preconditions && config.preconditions.length > 0) {
        const preconditionErrors = await checkPreconditions(config.preconditions);
        if (preconditionErrors.length > 0) {
            return {
                totalRows: 0,
                successCount: 0,
                failureCount: 0,
                errors: preconditionErrors,
            };
        }
    }

    const { rows, errors: parseErrors } = await parseCsv(csv, config.expectedHeaders);
    if (parseErrors.length > 0) {
        return {
            totalRows: 0,
            successCount: 0,
            failureCount: 0,
            errors: parseErrors,
        };
    }

    const totalRows = rows.length;

    const validatedRows: Array<{ rowNumber: number; data: T }> = [];
    for (const row of rows) {
        const result = config.validateRow(row.data, row.rowNumber);
        if (result.success && result.data) {
            validatedRows.push({ rowNumber: row.rowNumber, data: result.data });
        } else if (result.errors) {
            allErrors.push(...result.errors);
        }
    }

    const inFileDupErrors = checkInFileDuplicates(validatedRows, config.uniqueFields);
    allErrors.push(...inFileDupErrors);

    const dupRows = new Set(inFileDupErrors.map((e) => e.row));
    const deduped = validatedRows.filter((r) => !dupRows.has(r.rowNumber));

    let resolvedRows = deduped;
    if (Object.keys(config.relations).length > 0) {
        const relationMaps = await buildRelationMaps(config.relations, deduped);
        const { resolved, errors: relErrors } = resolveRelations(
            deduped,
            config.relations,
            relationMaps,
        );
        allErrors.push(...relErrors);
        resolvedRows = resolved;
    }

    if (config.uniqueFields.length > 0) {
        const dbDupErrors = await checkDbDuplicates(
            resolvedRows,
            config.uniqueFields,
            getModelNameFromConfig(config),
            config.uniqueFieldModels,
        );
        allErrors.push(...dbDupErrors);

        const dbDupRowSet = new Set(dbDupErrors.map((e) => e.row));
        resolvedRows = resolvedRows.filter((r) => !dbDupRowSet.has(r.rowNumber));
    }

    if (isTimetableConfig(resolvedRows)) {
        const overlapErrors = checkTimetableOverlaps(
            resolvedRows as Array<{ rowNumber: number; data: Record<string, unknown> & { class_id: string; teacher_id: string; room_id: string; day_of_week: string; start_time: string; end_time: string } }>,
        );
        allErrors.push(...overlapErrors);

        const overlapRows = new Set(overlapErrors.map((e) => e.row));
        resolvedRows = resolvedRows.filter((r) => !overlapRows.has(r.rowNumber));
    }

    let successCount = 0;
    let processedSoFar = 0;

    for (let i = 0; i < resolvedRows.length; i += BATCH_SIZE) {
        const batch = resolvedRows.slice(i, i + BATCH_SIZE);
        const docs = batch.map((r) => r.data);

        const persistErrors = await config.persist(docs);
        allErrors.push(...persistErrors);

        successCount += docs.length - persistErrors.length;
        processedSoFar += batch.length;

        if (onProgress) {
            onProgress(processedSoFar);
        }
    }

    return {
        totalRows,
        successCount,
        failureCount: totalRows - successCount,
        errors: allErrors,
    };
}

function getModelNameFromConfig<T>(config: EntityConfig<T>): string {
    if (config.expectedHeaders.includes('registration_number')) return 'Student';
    if (config.expectedHeaders.includes('teacher_id')) return 'Teacher';
    if (config.expectedHeaders.includes('day_of_week')) return 'Timetable';
    if (config.expectedHeaders.includes('class_name')) return 'Class';
    if (config.expectedHeaders.includes('subject_code')) return 'Subject';
    if (config.expectedHeaders.includes('room_number')) return 'Room';
    return 'Unknown';
}

async function checkPreconditions(
    preconditions: readonly string[],
): Promise<IngestionError[]> {
    const errors: IngestionError[] = [];

    await Promise.all(
        preconditions.map(async (modelName) => {
            const model = mongoose.model(modelName);
            const exists = await model.exists({});
            if (!exists) {
                errors.push({
                    row: 0,
                    column: '',
                    code: 'PRECONDITION_FAILED',
                    message: `Import requires at least one ${modelName} to exist. Please create ${modelName} records first.`,
                });
            }
        }),
    );

    return errors;
}

function isTimetableConfig<T extends Record<string, unknown>>(
    rows: Array<{ rowNumber: number; data: T }>,
): boolean {
    if (rows.length === 0) return false;
    const first = rows[0].data;
    return 'day_of_week' in first && 'start_time' in first && 'end_time' in first;
}
