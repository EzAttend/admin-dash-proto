import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { Document } from 'mongoose';
import type { CrudService } from '@/services/crud.factory';

export interface CrudController {
  list(req: Request, res: Response): Promise<void>;
  getById(req: Request, res: Response): Promise<void>;
  create(req: Request, res: Response): Promise<void>;
  update(req: Request, res: Response): Promise<void>;
  remove(req: Request, res: Response): Promise<void>;
}

export function createCrudController<T extends Document>(
  service: CrudService<T>,
  resourceName: string,
): CrudController {
  return {
    async list(_req: Request, res: Response): Promise<void> {
      const docs = await service.list();
      res.json({ status: 'ok', data: docs });
    },

    async getById(req: Request, res: Response): Promise<void> {
      const doc = await service.getById(req.params.id as string);
      res.json({ status: 'ok', data: doc });
    },

    async create(req: Request, res: Response): Promise<void> {
      const doc = await service.create(req.body);
      res.status(StatusCodes.CREATED).json({ status: 'ok', data: doc });
    },

    async update(req: Request, res: Response): Promise<void> {
      const doc = await service.update(req.params.id as string, req.body);
      res.json({ status: 'ok', data: doc });
    },

    async remove(req: Request, res: Response): Promise<void> {
      await service.remove(req.params.id as string);
      res.status(StatusCodes.NO_CONTENT).send();
    },
  };
}
