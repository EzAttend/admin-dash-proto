import { Subject } from '@/models';
import type { ISubject } from '@/models';
import { createCrudService } from './crud.factory';

export const subjectService = createCrudService<ISubject>(Subject);
