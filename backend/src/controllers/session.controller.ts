import { sessionService } from '@/services';
import { createCrudController } from './crud.factory';
import type { ISession } from '@/models';

export const sessionController = createCrudController<ISession>(sessionService, 'Session');
