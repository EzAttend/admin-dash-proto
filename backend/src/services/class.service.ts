import { Class } from '@/models';
import type { IClass } from '@/models';
import { createCrudService } from './crud.factory';

export const classService = createCrudService<IClass>(Class);
