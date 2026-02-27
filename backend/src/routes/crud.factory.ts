import { Router } from 'express';
import { asyncHandler, validate, requireAuth } from '@/middleware';
import { idParamSchema } from '@/schemas';
import type { CrudController } from '@/controllers/crud.factory';
import type { ZodSchema } from 'zod';

export interface CrudRouteOptions {
  controller: CrudController;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
}

export function createCrudRoutes(opts: CrudRouteOptions): Router {
  const router = Router();
  const { controller, createSchema, updateSchema } = opts;

  // All CRUD routes require authentication
  router.use(requireAuth);

  router.get('/', asyncHandler(controller.list));

  router.get(
    '/:id',
    validate({ params: idParamSchema }),
    asyncHandler(controller.getById),
  );

  router.post(
    '/',
    validate({ body: createSchema }),
    asyncHandler(controller.create),
  );

  router.put(
    '/:id',
    validate({ params: idParamSchema, body: updateSchema }),
    asyncHandler(controller.update),
  );

  return router;
}
