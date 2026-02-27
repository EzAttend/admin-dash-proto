import { studentController } from '@/controllers';
import { createStudentSchema, updateStudentSchema } from '@/schemas';
import { createCrudRoutes } from './crud.factory';

export const studentRoutes = createCrudRoutes({
  controller: studentController,
  createSchema: createStudentSchema,
  updateSchema: updateStudentSchema,
});
