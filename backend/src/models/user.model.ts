import { Schema, model, Document, Types } from 'mongoose';

export const USER_ROLES = ['student', 'teacher', 'admin'] as const;
export type UserRole = typeof USER_ROLES[number];

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
    },
  },
  { timestamps: true, collection: 'auth_users' },
);

export const User = model<IUser>('User', userSchema);
