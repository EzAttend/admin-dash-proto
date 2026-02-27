import mongoose from 'mongoose';
import type { IngestionError } from '../types';

export function checkInFileDuplicates<T extends Record<string, unknown>>(
  rows: Array<{ rowNumber: number; data: T }>,
  uniqueFields: readonly string[],
): IngestionError[] {
  const errors: IngestionError[] = [];

  for (const field of uniqueFields) {
    const seen = new Map<string, number>();

    for (const row of rows) {
      const value = String(row.data[field] ?? '').toLowerCase().trim();
      if (!value) continue;

      const firstRow = seen.get(value);
      if (firstRow !== undefined) {
        errors.push({
          row: row.rowNumber,
          column: field,
          code: 'DUPLICATE_IN_FILE',
          message: `Duplicate '${field}' value '${value}' — first seen at row ${firstRow}`,
        });
      } else {
        seen.set(value, row.rowNumber);
      }
    }
  }

  return errors;
}


export async function checkDbDuplicates<T extends Record<string, unknown>>(
  rows: Array<{ rowNumber: number; data: T }>,
  uniqueFields: readonly string[],
  modelName: string,
  fieldModelOverrides?: Record<string, string>,
): Promise<IngestionError[]> {
  const errors: IngestionError[] = [];

  for (const field of uniqueFields) {
    const effectiveModelName = fieldModelOverrides?.[field] ?? modelName;
    const model = mongoose.model(effectiveModelName);
    const normalToRows = new Map<string, number[]>();
    const normalToOriginal = new Map<string, string>();

    for (const row of rows) {
      const val = row.data[field];
      if (val === undefined || val === null || val === '') continue;
      const original = String(val).trim();
      const normalised = original.toLowerCase();

      if (!normalToOriginal.has(normalised)) {
        normalToOriginal.set(normalised, original);
      }

      const existing = normalToRows.get(normalised) ?? [];
      existing.push(row.rowNumber);
      normalToRows.set(normalised, existing);
    }

    if (normalToRows.size === 0) continue;

    const originals = Array.from(normalToOriginal.values());
    const existing = await model
      .find({ [field]: { $in: originals } }, { [field]: 1 })
      .lean();

    const existingNormalised = new Set(
      existing.map((doc) =>
        String((doc as Record<string, unknown>)[field]).toLowerCase().trim(),
      ),
    );

    for (const val of existingNormalised) {
      const affectedRows = normalToRows.get(val) ?? [];
      for (const rowNum of affectedRows) {
        errors.push({
          row: rowNum,
          column: field,
          code: 'DUPLICATE_IN_DB',
          message: `'${field}' value '${val}' already exists in database`,
        });
      }
    }
  }

  return errors;
}

interface TimetableRow {
  class_id: string;
  teacher_id: string;
  room_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export function checkTimetableOverlaps(
  rows: Array<{ rowNumber: number; data: TimetableRow }>,
): IngestionError[] {
  const errors: IngestionError[] = [];


  const roomSlots = new Map<string, Array<{ rowNumber: number; start: string; end: string }>>();
  const teacherSlots = new Map<string, Array<{ rowNumber: number; start: string; end: string }>>();

  for (const row of rows) {
    const { room_id, teacher_id, day_of_week, start_time, end_time } = row.data;

    const roomKey = `${room_id}|${day_of_week}`;
    const teacherKey = `${teacher_id}|${day_of_week}`;
    const slot = { rowNumber: row.rowNumber, start: start_time, end: end_time };

    if (!roomSlots.has(roomKey)) roomSlots.set(roomKey, []);
    roomSlots.get(roomKey)!.push(slot);

    if (!teacherSlots.has(teacherKey)) teacherSlots.set(teacherKey, []);
    teacherSlots.get(teacherKey)!.push(slot);
  }

  for (const [key, slots] of roomSlots) {
    const overlaps = findOverlaps(slots);
    for (const { rowA, rowB } of overlaps) {
      errors.push({
        row: rowB,
        column: 'room_id',
        code: 'CONFLICT_OVERLAP',
        message: `Room double-booked on ${key.split('|')[1]} — conflicts with row ${rowA}`,
      });
    }
  }

  for (const [key, slots] of teacherSlots) {
    const overlaps = findOverlaps(slots);
    for (const { rowA, rowB } of overlaps) {
      errors.push({
        row: rowB,
        column: 'teacher_id',
        code: 'CONFLICT_OVERLAP',
        message: `Teacher double-booked on ${key.split('|')[1]} — conflicts with row ${rowA}`,
      });
    }
  }

  return errors;
}

function findOverlaps(
  slots: Array<{ rowNumber: number; start: string; end: string }>,
): Array<{ rowA: number; rowB: number }> {
  const overlaps: Array<{ rowA: number; rowB: number }> = [];

  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      // slotB starts before slotA ends
      if (sorted[j].start < sorted[i].end) {
        overlaps.push({ rowA: sorted[i].rowNumber, rowB: sorted[j].rowNumber });
      }
    }
  }

  return overlaps;
}
