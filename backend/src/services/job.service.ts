import { UploadJob } from '@/models';
import type { IUploadJob } from '@/models';
import type { EntityType, JobStatus } from '@/models/upload-job.model';
import type { IngestionError } from '@/ingestion/types';
import type { Types } from 'mongoose';

export interface CreateJobInput {
  entityType: EntityType;
  totalRows: number;
  createdBy?: string;
}

export async function createJob(input: CreateJobInput): Promise<IUploadJob> {
  const job = await UploadJob.create({
    entity_type: input.entityType,
    status: 'PENDING' as JobStatus,
    total_rows: input.totalRows,
    processed_rows: 0,
    success_count: 0,
    failure_count: 0,
    row_errors: [],
    created_by: input.createdBy ?? 'admin',
  });

  return job;
}

export async function markJobRunning(jobId: Types.ObjectId | string): Promise<void> {
  await UploadJob.updateOne(
    { _id: jobId, status: 'PENDING' },
    { $set: { status: 'RUNNING' as JobStatus } },
  );
}

export async function markJobCompleted(
  jobId: Types.ObjectId | string,
  successCount: number,
  failureCount: number,
  errors: IngestionError[],
): Promise<void> {
  await UploadJob.updateOne(
    { _id: jobId },
    {
      $set: {
        status: 'COMPLETED' as JobStatus,
        success_count: successCount,
        failure_count: failureCount,
        row_errors: errors,
        processed_rows: successCount + failureCount,
        completed_at: new Date(),
      },
    },
  );
}

export async function markJobFailed(
  jobId: Types.ObjectId | string,
  errorMessage: string,
): Promise<void> {
  await UploadJob.updateOne(
    { _id: jobId },
    {
      $set: {
        status: 'FAILED' as JobStatus,
        completed_at: new Date(),
        row_errors: [{
          row: 0,
          column: '',
          code: 'INSERT_FAILED',
          message: errorMessage,
        }],
      },
    },
  );
}


export async function updateJobProgress(
  jobId: Types.ObjectId | string,
  processedRows: number,
): Promise<void> {
  await UploadJob.updateOne(
    { _id: jobId },
    { $set: { processed_rows: processedRows } },
  );
}

export async function getJobById(jobId: string): Promise<IUploadJob | null> {
  return UploadJob.findById(jobId);
}

export async function listJobs(filter?: {
  entityType?: EntityType;
  status?: JobStatus;
}): Promise<IUploadJob[]> {
  const query: Record<string, unknown> = {};
  if (filter?.entityType) query.entity_type = filter.entityType;
  if (filter?.status) query.status = filter.status;

  return UploadJob.find(query).sort({ createdAt: -1 });
}
