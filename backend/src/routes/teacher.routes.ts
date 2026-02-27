import { teacherController } from '@/controllers';
import { createTeacherSchema, updateTeacherSchema } from '@/schemas';
import { createCrudRoutes } from './crud.factory';

export const teacherRoutes = createCrudRoutes({
  controller: teacherController,
  createSchema: createTeacherSchema,
  updateSchema: updateTeacherSchema,
});
