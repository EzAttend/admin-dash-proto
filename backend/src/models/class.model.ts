import { Schema, model, Document, Types } from 'mongoose';

export interface IClass extends Document {
  _id: Types.ObjectId;
  class_name: string;
  batch: string;
  createdAt: Date;
  updatedAt: Date;
}

const classSchema = new Schema<IClass>(
  {
    class_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    batch: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Class = model<IClass>('Class', classSchema);
