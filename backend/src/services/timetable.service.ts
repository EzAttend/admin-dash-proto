import { Timetable } from '@/models';
import type { ITimetable } from '@/models';
import { createCrudService } from './crud.factory';
import { AppError } from '@/utils';
import { validateRefs } from '@/ingestion';
import type { RefCheck } from '@/ingestion';

const baseCrud = createCrudService<ITimetable>(Timetable, [
  { path: 'class_id', select: 'class_name' },
  {
    path: 'teacher_id',
    select: 'userId teacher_id',
    populate: { path: 'userId', select: 'name email' },
  },
  { path: 'subject_id', select: 'subject_code subject_name' },
  { path: 'room_id', select: 'room_number building_name' },
]);

const TIMETABLE_REFS: readonly RefCheck[] = [
  { field: 'class_id', modelName: 'Class' },
  { field: 'teacher_id', modelName: 'Teacher' },
  { field: 'subject_id', modelName: 'Subject' },
  { field: 'room_id', modelName: 'Room' },
];

async function checkOverlaps(
  data: Record<string, unknown>,
  excludeId?: string,
): Promise<void> {
  const { class_id, teacher_id, room_id, day_of_week, start_time, end_time } = data;

  if (!day_of_week || !start_time || !end_time) return;

  const baseFilter: Record<string, unknown> = {
    day_of_week,
    start_time: { $lt: end_time },
    end_time: { $gt: start_time },
  };

  if (excludeId) {
    baseFilter._id = { $ne: excludeId };
  }

  // Check class overlap
  if (class_id) {
    const classConflict = await Timetable.findOne({ ...baseFilter, class_id });
    if (classConflict) {
      throw AppError.conflict(
        `Time slot overlaps with existing class entry on ${day_of_week} (${classConflict.start_time}–${classConflict.end_time})`,
      );
    }
  }

  // Check room double-booking
  if (room_id) {
    const roomConflict = await Timetable.findOne({ ...baseFilter, room_id });
    if (roomConflict) {
      throw AppError.conflict(
        `Room is double-booked on ${day_of_week} (${roomConflict.start_time}–${roomConflict.end_time})`,
      );
    }
  }

  // Check teacher double-booking
  if (teacher_id) {
    const teacherConflict = await Timetable.findOne({ ...baseFilter, teacher_id });
    if (teacherConflict) {
      throw AppError.conflict(
        `Teacher is double-booked on ${day_of_week} (${teacherConflict.start_time}–${teacherConflict.end_time})`,
      );
    }
  }
}

export const timetableService = {
  ...baseCrud,

  async create(data: Record<string, unknown>): Promise<ITimetable> {
    await validateRefs(data, TIMETABLE_REFS);
    await checkOverlaps(data);
    return baseCrud.create(data);
  },

  async update(id: string, data: Record<string, unknown>): Promise<ITimetable> {
    await validateRefs(data, TIMETABLE_REFS);
    await checkOverlaps(data, id);
    return baseCrud.update(id, data);
  },
};
