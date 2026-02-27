import { Request, Response } from 'express';
import { getJobById, listJobs } from '@/services/job.service';
import type { EntityType, JobStatus } from '@/models/upload-job.model';

export const jobController = {
  async list(req: Request, res: Response): Promise<void> {
    const filter: { entityType?: EntityType; status?: JobStatus } = {};
    if (req.query.entityType) filter.entityType = req.query.entityType as EntityType;
    if (req.query.status) filter.status = req.query.status as JobStatus;

    const jobs = await listJobs(filter);
    res.json({ status: 'ok', data: jobs });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const job = await getJobById(req.params.id as string);
    if (!job) {
      res.status(404).json({ status: 'error', message: 'Job not found' });
      return;
    }
    res.json({ status: 'ok', data: job });
  },
};
