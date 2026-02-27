import { z } from 'zod';

export const createClassSchema = z.object({
  class_name: z
    .string()
    .trim()
    .min(1, 'Class name is required'),
  batch: z
    .string()
    .trim()
    .min(1, 'Batch is required'),
});

export const updateClassSchema = createClassSchema.partial();

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
