import { attendanceService } from '@/services';
import { createCrudController } from './crud.factory';
import type { IAttendance } from '@/models';

export const attendanceController = createCrudController<IAttendance>(attendanceService, 'Attendance');
