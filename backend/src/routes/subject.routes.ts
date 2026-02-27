import { subjectController } from '@/controllers';
import { createSubjectSchema, updateSubjectSchema } from '@/schemas';
import { createCrudRoutes } from './crud.factory';

export const subjectRoutes = createCrudRoutes({
  controller: subjectController,
  createSchema: createSubjectSchema,
  updateSchema: updateSubjectSchema,
});
