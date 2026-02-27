import { timetableController } from '@/controllers';
import { createTimetableSchema, updateTimetableSchema } from '@/schemas';
import { createCrudRoutes } from './crud.factory';

export const timetableRoutes = createCrudRoutes({
  controller: timetableController,
  createSchema: createTimetableSchema,
  updateSchema: updateTimetableSchema,
});
