import { Schema, model, Document, Types } from 'mongoose';

export const JOB_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'] as const;
export type JobStatus = typeof JOB_STATUSES[number];

export const ENTITY_TYPES = [
  'CLASS_IMPORT',
  'SUBJECT_IMPORT',
  'ROOM_IMPORT',
  'STUDENT_IMPORT',
  'TEACHER_IMPORT',
  'TIMETABLE_IMPORT',
] as const;
export type EntityType = typeof ENTITY_TYPES[number];

export interface IUploadJob extends Document {
  _id: Types.ObjectId;
  entity_type: EntityType;
  status: JobStatus;
  total_rows: number;
  processed_rows: number;
  success_count: number;
  failure_count: number;
  row_errors: Array<{
    row: number;
    column: string;
    code: string;
    message: string;
  }>;
  created_by: string;
  completed_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const uploadJobSchema = new Schema<IUploadJob>(
  {
    entity_type: {
      type: String,
      enum: ENTITY_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: 'PENDING',
    },
    total_rows: {
      type: Number,
      default: 0,
    },
    processed_rows: {
      type: Number,
      default: 0,
    },
    success_count: {
      type: Number,
      default: 0,
    },
    failure_count: {
      type: Number,
      default: 0,
    },
    row_errors: [
      {
        row: { type: Number, required: true },
        column: { type: String, required: true },
        code: { type: String, required: true },
        message: { type: String, required: true },
      },
    ],
    created_by: {
      type: String,
      default: 'admin',
    },
    completed_at: {
      type: Date,
    },
  },
  { timestamps: true, collection: 'upload_jobs' },
);

export const UploadJob = model<IUploadJob>('UploadJob', uploadJobSchema);
