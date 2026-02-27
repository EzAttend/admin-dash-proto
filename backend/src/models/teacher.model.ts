import { Schema, model, Document, Types } from 'mongoose';

export interface ITeacher extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  teacher_id: string;
  createdAt: Date;
  updatedAt: Date;
}

const teacherSchema = new Schema<ITeacher>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    teacher_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Teacher = model<ITeacher>('Teacher', teacherSchema);
