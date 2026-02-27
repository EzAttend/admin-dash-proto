import { z } from 'zod';
import { objectIdSchema, timeSchema } from './common.schema';
import { DAYS_OF_WEEK } from '@/models';

export const createTimetableSchema = z.object({
  class_id: objectIdSchema,
  teacher_id: objectIdSchema,
  subject_id: objectIdSchema,
  room_id: objectIdSchema,
  day_of_week: z.enum(DAYS_OF_WEEK),
  start_time: timeSchema,
  end_time: timeSchema,
}).refine(
  (data) => data.start_time < data.end_time,
  { message: 'start_time must be before end_time', path: ['end_time'] },
);

export const updateTimetableSchema = z.object({
  class_id: objectIdSchema.optional(),
  teacher_id: objectIdSchema.optional(),
  subject_id: objectIdSchema.optional(),
  room_id: objectIdSchema.optional(),
  day_of_week: z.enum(DAYS_OF_WEEK).optional(),
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
});

export type CreateTimetableInput = z.infer<typeof createTimetableSchema>;
export type UpdateTimetableInput = z.infer<typeof updateTimetableSchema>;
