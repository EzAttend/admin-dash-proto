import { z } from 'zod';
import { objectIdSchema } from './common.schema';
import { ENROLLMENT_STATUSES } from '@/models';

export const createStudentSchema = z.object({
  registration_number: z
    .string()
    .trim()
    .min(1, 'Registration number is required'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  class_id: objectIdSchema,
  face_vector: z
    .array(z.number())
    .optional()
    .default([]),
  enrollment_status: z
    .enum(ENROLLMENT_STATUSES)
    .optional()
    .default('Pending'),
});

export const updateStudentSchema = createStudentSchema
  .omit({ password: true })
  .partial()
  .extend({
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .optional(),
  });

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
