import { Room } from '@/models';
import type { IRoom } from '@/models';
import { createCrudService } from './crud.factory';

export const roomService = createCrudService<IRoom>(Room);
