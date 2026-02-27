import mongoose from 'mongoose';
import { AppError } from '@/utils';
import type { FieldError } from '@/utils';
import type { RelationConfig, RelationMap, ResolvedRelations, IngestionError, ParsedRow } from '../types';


export interface RefCheck {
    field: string;
    modelName: string;
    isArray?: boolean;
}


export async function validateRefs(
    data: Record<string, unknown>,
    refChecks: readonly RefCheck[],
): Promise<void> {
    const errors: FieldError[] = [];

    await Promise.all(
        refChecks.map(async ({ field, modelName, isArray }) => {
            const value = data[field];

            // Skip if field not present (optional ref or partial update)
            if (value === undefined || value === null) return;

            const model = mongoose.model(modelName);

            if (isArray) {
                const ids = value as unknown[];
                if (!Array.isArray(ids) || ids.length === 0) return;

                const count = await model.countDocuments({ _id: { $in: ids } });
                if (count !== ids.length) {
                    errors.push({
                        field,
                        message: `One or more referenced ${modelName}(s) not found`,
                        code: 'RELATION_NOT_FOUND',
                    });
                }
            } else {
                const exists = await model.exists({ _id: value });
                if (!exists) {
                    errors.push({
                        field,
                        message: `Referenced ${modelName} not found`,
                        code: 'RELATION_NOT_FOUND',
                    });
                }
            }
        }),
    );

    if (errors.length > 0) {
        throw AppError.badRequest('Referenced entities do not exist', errors);
    }
}

function extractUniqueLookupValues<T extends Record<string, unknown>>(
    rows: Array<{ rowNumber: number; data: T }>,
    relations: Record<string, RelationConfig>,
): Record<string, string[]> {
    const result: Record<string, Set<string>> = {};

    for (const column of Object.keys(relations)) {
        result[column] = new Set();
    }

    for (const row of rows) {
        for (const column of Object.keys(relations)) {
            const val = row.data[column];
            if (val !== undefined && val !== null && val !== '') {
                // Handle pipe-separated values (e.g. "CS101|MA201")
                const strVal = String(val);
                if (strVal.includes('|')) {
                    for (const part of strVal.split('|')) {
                        const trimmed = part.trim();
                        if (trimmed) result[column].add(trimmed);
                    }
                } else {
                    result[column].add(strVal);
                }
            }
        }
    }

    const out: Record<string, string[]> = {};
    for (const [column, set] of Object.entries(result)) {
        out[column] = Array.from(set);
    }
    return out;
}

export async function buildRelationMaps<T extends Record<string, unknown>>(
    relations: Record<string, RelationConfig>,
    rows: Array<{ rowNumber: number; data: T }>,
): Promise<ResolvedRelations> {
    const resolved: ResolvedRelations = {};
    const lookupValues = extractUniqueLookupValues(rows, relations);

    const entries = Object.entries(relations);
    const results = await Promise.all(
        entries.map(async ([column, config]) => {
            const model = mongoose.model(config.modelName);
            const valuesToFind = lookupValues[column] ?? [];

            // Nothing to look up
            if (valuesToFind.length === 0) {
                return { column, map: new Map<string, string>() };
            }

            const docs = await model
                .find(
                    { [config.lookupField]: { $in: valuesToFind } },
                    { [config.lookupField]: 1 },
                )
                .lean();

            const map: RelationMap = new Map();
            for (const doc of docs) {
                const key = String((doc as Record<string, unknown>)[config.lookupField]);
                const id = String((doc as Record<string, unknown>)._id);
                map.set(key, id);
            }

            return { column, map };
        }),
    );

    for (const { column, map } of results) {
        resolved[column] = map;
    }

    return resolved;
}

export function resolveRelations<T extends Record<string, unknown>>(
    rows: Array<{ rowNumber: number; data: T }>,
    relations: Record<string, RelationConfig>,
    resolvedRelations: ResolvedRelations,
): { resolved: Array<{ rowNumber: number; data: T }>; errors: IngestionError[] } {
    const resolved: Array<{ rowNumber: number; data: T }> = [];
    const errors: IngestionError[] = [];

    for (const row of rows) {
        let hasError = false;

        for (const [column, config] of Object.entries(relations)) {
            const lookupValue = row.data[column];
            if (lookupValue === undefined || lookupValue === null || lookupValue === '') {
                continue;
            }

            const map = resolvedRelations[column];
            if (!map) {
                errors.push({
                    row: row.rowNumber,
                    column,
                    code: 'RELATION_NOT_FOUND',
                    message: `No relation map for column '${column}'`,
                });
                hasError = true;
                continue;
            }

            const strVal = String(lookupValue);

            // Handle pipe-separated multi-value fields
            if (strVal.includes('|')) {
                const parts = strVal.split('|').map((p) => p.trim()).filter(Boolean);
                const resolvedIds: string[] = [];
                let partError = false;

                for (const part of parts) {
                    const objectId = map.get(part);
                    if (!objectId) {
                        errors.push({
                            row: row.rowNumber,
                            column,
                            code: 'RELATION_NOT_FOUND',
                            message: `Referenced ${config.modelName} '${part}' (matched by ${config.lookupField}) does not exist`,
                        });
                        partError = true;
                    } else {
                        resolvedIds.push(objectId);
                    }
                }

                if (partError) {
                    hasError = true;
                } else {
                    // Store resolved IDs as pipe-separated string
                    (row.data as Record<string, unknown>)[column] = resolvedIds.join('|');
                }
            } else {
                const objectId = map.get(strVal);
                if (!objectId) {
                    errors.push({
                        row: row.rowNumber,
                        column,
                        code: 'RELATION_NOT_FOUND',
                        message: `Referenced ${config.modelName} '${strVal}' (matched by ${config.lookupField}) does not exist`,
                    });
                    hasError = true;
                    continue;
                }

                // Replace human value with ObjectId
                (row.data as Record<string, unknown>)[column] = objectId;
            }
        }

        if (!hasError) {
            resolved.push(row);
        }
    }

    return { resolved, errors };
}
