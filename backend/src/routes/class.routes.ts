import { classController } from '@/controllers';
import { createClassSchema, updateClassSchema } from '@/schemas';
import { createCrudRoutes } from './crud.factory';

export const classRoutes = createCrudRoutes({
  controller: classController,
  createSchema: createClassSchema,
  updateSchema: updateClassSchema,
});
