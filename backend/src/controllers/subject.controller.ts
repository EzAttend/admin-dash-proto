import { subjectService } from '@/services';
import { createCrudController } from './crud.factory';
import type { ISubject } from '@/models';

export const subjectController = createCrudController<ISubject>(subjectService, 'Subject');
