import { Model, Document, FilterQuery } from 'mongoose';
import { AppError } from '@/utils';

export interface PopulateSpec {
  path: string;
  select: string;
  populate?: { path: string; select: string };
}

export interface CrudService<T extends Document> {
  list(filter?: FilterQuery<T>): Promise<T[]>;
  getById(id: string): Promise<T>;
  create(data: Record<string, unknown>): Promise<T>;
  update(id: string, data: Record<string, unknown>): Promise<T>;
  remove(id: string): Promise<T>;
}

export function createCrudService<T extends Document>(
  model: Model<T>,
  populateFields?: PopulateSpec[],
): CrudService<T> {
  const name = model.modelName;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function applyPopulate(query: any): any {
    if (populateFields) {
      for (const p of populateFields) {
        query = query.populate(p);
      }
    }
    return query;
  }

  return {
    async list(filter: FilterQuery<T> = {} as FilterQuery<T>): Promise<T[]> {
      const query = model.find(filter).sort({ createdAt: -1 });
      return applyPopulate(query).lean() as unknown as T[];
    },

    async getById(id: string): Promise<T> {
      const query = model.findById(id);
      const doc = await applyPopulate(query).lean();
      if (!doc) throw AppError.notFound(name);
      return doc as T;
    },

    async create(data: Record<string, unknown>): Promise<T> {
      const doc = await model.create(data);
      return doc.toObject() as T;
    },

    async update(id: string, data: Record<string, unknown>): Promise<T> {
      const doc = await model.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      }).lean();
      if (!doc) throw AppError.notFound(name);
      return doc as T;
    },

    async remove(id: string): Promise<T> {
      const doc = await model.findByIdAndDelete(id).lean();
      if (!doc) throw AppError.notFound(name);
      return doc as T;
    },
  };
}
