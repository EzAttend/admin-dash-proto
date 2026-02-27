import { attendanceController } from '@/controllers';
import { createAttendanceSchema, updateAttendanceSchema } from '@/schemas';
import { createCrudRoutes } from './crud.factory';

export const attendanceRoutes = createCrudRoutes({
  controller: attendanceController,
  createSchema: createAttendanceSchema,
  updateSchema: updateAttendanceSchema,
});
