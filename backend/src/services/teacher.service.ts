import mongoose from 'mongoose';
import { Teacher, User, AuthAccount } from '@/models';
import type { ITeacher } from '@/models';
import { AppError, hashPassword } from '@/utils';


const POPULATE_SPECS = [
  { path: 'userId', select: 'name email role' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPopulate(query: any): any {
  for (const p of POPULATE_SPECS) {
    query = query.populate(p);
  }
  return query;
}

export const teacherService = {
  async list(): Promise<ITeacher[]> {
    const query = Teacher.find().sort({ createdAt: -1 });
    return applyPopulate(query).lean() as unknown as ITeacher[];
  },

  async getById(id: string): Promise<ITeacher> {
    const query = Teacher.findById(id);
    const doc = await applyPopulate(query).lean();
    if (!doc) throw AppError.notFound('Teacher');
    return doc as ITeacher;
  },

  async create(data: Record<string, unknown>): Promise<ITeacher> {
    const { name, email, password, ...domainFields } = data as {
      name: string;
      email: string;
      password: string;
      [key: string]: unknown;
    };

    const existingUser = await User.exists({ email });
    if (existingUser) {
      throw AppError.conflict(`Email '${email}' is already in use`);
    }

    const passwordHash = await hashPassword(password);

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const [user] = await User.create(
        [{ name, email, role: 'teacher' }],
        { session },
      );

      await AuthAccount.create(
        [{ userId: user._id, accountId: user._id, providerId: 'credential', password: passwordHash }],
        { session },
      );

      const [teacher] = await Teacher.create(
        [{
          userId: user._id,
          ...domainFields,
        }],
        { session },
      );

      await session.commitTransaction();

      return this.getById(teacher._id.toString());
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async update(id: string, data: Record<string, unknown>): Promise<ITeacher> {
    const { name, email, password, ...domainFields } = data as {
      name?: string;
      email?: string;
      password?: string;
      [key: string]: unknown;
    };

    const existing = await Teacher.findById(id);
    if (!existing) throw AppError.notFound('Teacher');

    if (email) {
      const conflict = await User.exists({
        email,
        _id: { $ne: existing.userId },
      });
      if (conflict) {
        throw AppError.conflict(`Email '${email}' is already in use`);
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const userUpdate: Record<string, unknown> = {};
      if (name !== undefined) userUpdate.name = name;
      if (email !== undefined) userUpdate.email = email;

      if (Object.keys(userUpdate).length > 0) {
        await User.updateOne(
          { _id: existing.userId },
          { $set: userUpdate },
          { session },
        );
      }

      if (password) {
        const passwordHash = await hashPassword(password);
        await AuthAccount.updateOne(
          { userId: existing.userId },
          { $set: { password: passwordHash } },
          { session },
        );
      }

      if (Object.keys(domainFields).length > 0) {
        await Teacher.updateOne(
          { _id: id },
          { $set: domainFields },
          { session, runValidators: true },
        );
      }

      await session.commitTransaction();

      return this.getById(id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async remove(id: string): Promise<ITeacher> {
    const teacher = await Teacher.findById(id);
    if (!teacher) throw AppError.notFound('Teacher');

    const snapshot = await this.getById(id);

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      await Teacher.deleteOne({ _id: id }, { session });

      await AuthAccount.deleteOne({ userId: teacher.userId }, { session });

      await User.deleteOne({ _id: teacher.userId }, { session });

      await session.commitTransaction();

      return snapshot;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
