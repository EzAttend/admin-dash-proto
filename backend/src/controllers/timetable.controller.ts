import { timetableService } from '@/services';
import { createCrudController } from './crud.factory';
import type { ITimetable } from '@/models';

export const timetableController = createCrudController<ITimetable>(timetableService, 'Timetable');
