import { Schema, model, Document, Types } from 'mongoose';

export interface IAuthAccount extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  accountId: Types.ObjectId;
  providerId: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const authAccountSchema = new Schema<IAuthAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    providerId: {
      type: String,
      required: true,
      default: 'credential',
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, collection: 'auth_accounts' },
);

export const AuthAccount = model<IAuthAccount>('AuthAccount', authAccountSchema);
