import { z } from 'zod';

export const createTeacherSchema = z.object({
  teacher_id: z
    .string()
    .trim()
    .min(1, 'Teacher ID is required'),
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
});

export const updateTeacherSchema = createTeacherSchema
  .omit({ password: true })
  .partial()
  .extend({
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .optional(),
  });

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
