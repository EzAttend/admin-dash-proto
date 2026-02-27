import { classService } from '@/services';
import { createCrudController } from './crud.factory';
import type { IClass } from '@/models';

export const classController = createCrudController<IClass>(classService, 'Class');
