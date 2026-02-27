import { Schema, model, Document, Types } from 'mongoose';

export const ATTENDANCE_STATUSES = ['Present', 'Late', 'Absent'] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

export const VERIFICATION_METHODS = ['Face', 'QR_Fallback'] as const;
export type VerificationMethod = typeof VERIFICATION_METHODS[number];

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  session_id: Types.ObjectId;
  student_id: Types.ObjectId;
  timestamp: Date;
  status: AttendanceStatus;
  verification_method: VerificationMethod;
  confidence_score: number;
  location_verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    session_id: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    student_id: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
    },
    verification_method: {
      type: String,
      enum: VERIFICATION_METHODS,
      required: true,
    },
    confidence_score: {
      type: Number,
    },
    location_verified: {
      type: Boolean,
    },
  },
  { timestamps: true },
);

attendanceSchema.index({ session_id: 1, student_id: 1 }, { unique: true });

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
