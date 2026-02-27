import { Schema, model, Document, Types } from 'mongoose';

export interface ITeacherLocationData {
  lat: number;
  lng: number;
  altitude: number;
}

export interface ISession extends Document {
  _id: Types.ObjectId;
  timetable_id: Types.ObjectId;
  date: Date;
  is_active: boolean;
  start_time_actual: Date;
  teacher_location_data: ITeacherLocationData;
  qr_code_secret: string;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    timetable_id: {
      type: Schema.Types.ObjectId,
      ref: 'Timetable',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    start_time_actual: {
      type: Date,
    },
    teacher_location_data: {
      lat: Number,
      lng: Number,
      altitude: Number,
    },
    qr_code_secret: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Session = model<ISession>('Session', sessionSchema);
