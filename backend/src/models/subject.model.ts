import { Schema, model, Document, Types } from 'mongoose';

export interface ISubject extends Document {
  _id: Types.ObjectId;
  subject_code: string;
  subject_name: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    subject_code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subject_name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Subject = model<ISubject>('Subject', subjectSchema);
