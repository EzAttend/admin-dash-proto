import { roomController } from '@/controllers';
import { createRoomSchema, updateRoomSchema } from '@/schemas';
import { createCrudRoutes } from './crud.factory';

export const roomRoutes = createCrudRoutes({
  controller: roomController,
  createSchema: createRoomSchema,
  updateSchema: updateRoomSchema,
});
