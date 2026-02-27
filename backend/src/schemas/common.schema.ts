import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid 24-character ObjectId');

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm format (24hr)');

export const idParamSchema = z.object({
  id: objectIdSchema,
});
