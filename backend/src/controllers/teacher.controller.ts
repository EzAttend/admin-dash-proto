import { teacherService } from '@/services';
import { createCrudController } from './crud.factory';
import type { ITeacher } from '@/models';

export const teacherController = createCrudController<ITeacher>(teacherService, 'Teacher');
