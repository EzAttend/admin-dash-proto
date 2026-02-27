import { z } from 'zod';
import { objectIdSchema } from './common.schema';
import { ATTENDANCE_STATUSES, VERIFICATION_METHODS } from '@/models';

export const createAttendanceSchema = z.object({
  session_id: objectIdSchema,
  student_id: objectIdSchema,
  timestamp: z
    .string()
    .datetime({ message: 'Must be a valid ISO date-time string' })
    .or(z.date()),
  status: z.enum(ATTENDANCE_STATUSES),
  verification_method: z.enum(VERIFICATION_METHODS),
  confidence_score: z.number().min(0).max(1).optional(),
  location_verified: z.boolean().optional(),
});

export const updateAttendanceSchema = z.object({
  session_id: objectIdSchema.optional(),
  student_id: objectIdSchema.optional(),
  timestamp: z
    .string()
    .datetime({ message: 'Must be a valid ISO date-time string' })
    .or(z.date())
    .optional(),
  status: z.enum(ATTENDANCE_STATUSES).optional(),
  verification_method: z.enum(VERIFICATION_METHODS).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  location_verified: z.boolean().optional(),
});

export type CreateAttendanceInput = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
