import { Attendance } from '@/models';
import type { IAttendance } from '@/models';
import { createCrudService } from './crud.factory';

export const attendanceService = createCrudService<IAttendance>(Attendance);
