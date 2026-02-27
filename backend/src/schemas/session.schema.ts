import { z } from 'zod';
import { objectIdSchema } from './common.schema';

const teacherLocationSchema = z.object({
  lat: z.number({ required_error: 'Latitude is required' }),
  lng: z.number({ required_error: 'Longitude is required' }),
  altitude: z.number({ required_error: 'Altitude is required' }),
});

export const createSessionSchema = z.object({
  timetable_id: objectIdSchema,
  date: z
    .string()
    .datetime({ message: 'Must be a valid ISO date string' })
    .or(z.date()),
  is_active: z.boolean().optional().default(true),
  start_time_actual: z
    .string()
    .datetime({ message: 'Must be a valid ISO date-time string' })
    .or(z.date())
    .optional(),
  teacher_location_data: teacherLocationSchema.optional(),
  qr_code_secret: z.string().optional(),
});

export const updateSessionSchema = z.object({
  timetable_id: objectIdSchema.optional(),
  date: z
    .string()
    .datetime({ message: 'Must be a valid ISO date string' })
    .or(z.date())
    .optional(),
  is_active: z.boolean().optional(),
  start_time_actual: z
    .string()
    .datetime({ message: 'Must be a valid ISO date-time string' })
    .or(z.date())
    .optional(),
  teacher_location_data: teacherLocationSchema.optional(),
  qr_code_secret: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
