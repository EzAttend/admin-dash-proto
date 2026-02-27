import { studentService } from '@/services';
import { createCrudController } from './crud.factory';
import type { IStudent } from '@/models';

export const studentController = createCrudController<IStudent>(studentService, 'Student');
