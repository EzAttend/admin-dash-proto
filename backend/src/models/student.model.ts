import { Schema, model, Document, Types } from 'mongoose';

export const ENROLLMENT_STATUSES = ['Pending', 'Enrolled', 'Failed'] as const;
export type EnrollmentStatus = typeof ENROLLMENT_STATUSES[number];

export interface IStudent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  registration_number: string;
  class_id: Types.ObjectId;
  face_vector: number[];
  enrollment_status: EnrollmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    registration_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    class_id: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    face_vector: {
      type: [Number],
      default: [],
    },
    enrollment_status: {
      type: String,
      enum: ENROLLMENT_STATUSES,
      default: 'Pending',
    },
  },
  { timestamps: true },
);

export const Student = model<IStudent>('Student', studentSchema);
