import { Session } from '@/models';
import type { ISession } from '@/models';
import { createCrudService } from './crud.factory';

export const sessionService = createCrudService<ISession>(Session);
