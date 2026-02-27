import { sessionController } from '@/controllers';
import { createSessionSchema, updateSessionSchema } from '@/schemas';
import { createCrudRoutes } from './crud.factory';

export const sessionRoutes = createCrudRoutes({
  controller: sessionController,
  createSchema: createSessionSchema,
  updateSchema: updateSessionSchema,
});
