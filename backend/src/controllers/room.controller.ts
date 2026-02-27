import { roomService } from '@/services';
import { createCrudController } from './crud.factory';
import type { IRoom } from '@/models';

export const roomController = createCrudController<IRoom>(roomService, 'Room');
