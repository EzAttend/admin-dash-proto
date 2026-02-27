import { z } from 'zod';

export const createSubjectSchema = z.object({
  subject_code: z
    .string()
    .trim()
    .min(1, 'Subject code is required'),
  subject_name: z
    .string()
    .trim()
    .min(1, 'Subject name is required'),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
